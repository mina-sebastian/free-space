import base64
import json
import re
import shutil
import threading
import time
import logging
import requests
from flask import Flask, jsonify
from ollama import Client
from requests.exceptions import RequestException

from PyPDF2 import PdfReader
from docx import Document

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def encode_image_to_base64(image_path):
    """Encode the image to base64 format."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def post_request_ollama(client, model, prompt, image_path):
    """Send a request to the Ollama API using the client."""
    response = client.generate(
        model = model,
        prompt = prompt,
        images = [encode_image_to_base64(image_path)]
    )
    return response

def post_request_llama3(client, model, prompt):
    """Send a request to the Ollama API using the client."""
    response = client.chat(
        model=model,
        messages=[{
            'role': 'user',
            'content': prompt,
        }]
    )
    return response

def fetch_tags():
    """Fetch tags from the /api/file/getAllTags endpoint."""
    try:
        response = requests.get('http://next-app:3000/api/file/getAllTags')
        if response.status_code == 200:
            tags_data = response.json()
            tags = [tag['name'] for tag in tags_data]
            return tags
        else:
            logging.error("Failed to fetch tags, status code: %s", response.status_code)
            return -1
    except RequestException as e:
        logging.error("Error fetching tags: %s", e)
        return -1

def fetch_files():
    """Fetch files that need to be tagged from the /api/file/getUntaggedFiles endpoint."""
    try:
        response = requests.get('http://next-app:3000/api/file/getUntaggedFiles')
        if response.status_code == 200:
            files = response.json()
            return files
        else:
            logging.error("Failed to fetch files, status code: %s", response.status_code)
            return []
    except RequestException as e:
        logging.error("Error fetching files: %s", e)
        return []

def initialize_ollama_client():
    client = Client(host='http://ollama:11434')

    try:
        client.show('llava')
        logging.info("LLAVA FOUND")
    except:
        logging.info("LLAVA NOT FOUND, EXTRACTING..")
        client.pull('llava')
        logging.info("LLAVA EXTRACTED")

    try:
        client.show('llama3')
        logging.info("llama3 FOUND")
    except:
        logging.info("llama3 NOT FOUND, EXTRACTING..")
        client.pull('llama3')
        logging.info("llama3 EXTRACTED")

    return client

def read_file_content(file_path, name):
    """Read the content of a file based on its type."""
    try:
        if name.endswith('.txt') or name.endswith('.py'):
            with open(file_path, 'r') as file:
                return file.read()
        elif name.endswith('.pdf'):
            return read_pdf(file_path)
        elif name.endswith('.docx'):
            return read_word(file_path)
        else:
            logging.error("Unsupported file format for file %s", file_path)
            return -2
    except Exception as e:
        logging.error("Error reading file %s: %s", file_path, e)
        return None

def read_pdf(file_path):
    reader = PdfReader(file_path)
    number_of_pages = len(reader.pages)
    text = ""
    for i in range(number_of_pages):
        page = reader.pages[i]
        text += page.extract_text()
    print(text)
    return text

def read_word(file_path):
    """Read content from a Word file."""
    text = ""
    try:
        doc = Document(file_path)
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
    except Exception as e:
        logging.error("Error reading Word file %s: %s", file_path, e)
    return text

def get_file_metadata(file_path):
    file_path = file_path + '.info'
    with open(file_path, 'r') as file:
        data = json.load(file)
        return data
    
    return None

def process_files(client, tags):
    """Process the files to get tags using Ollama API."""
    files = fetch_files()
    if not files:
        logging.error("No files to process")
        return

    for file in files:
        try:
            file_path = file['path']
            
            file_path = f"/srv/tusd-data/data/{file_path}"
            file_meta = get_file_metadata(file_path)
            name = file_meta['MetaData']['filename']
            model = "llava"
            prompt = "Describe briefly this image, just the relevant parts:"

            if name.endswith('.jpg') or name.endswith('.jpeg') or name.endswith('.png'):
                logging.info("Sending request to Ollama API for image file: %s", file['hash'])
                response = post_request_ollama(client, model, prompt, file_path)
                response_text = response["response"] if response and response["response"] else None
            else:
                logging.info("Reading content for file: %s", file['hash'])
                response_text = read_file_content(file_path, name)

            if response_text == -2:
                response = requests.post('http://next-app:3000/api/file/setHashTags', json={
                        'hash': file['hash'],
                        'tags': []
                    })
                logging.error("Unsupported file format for file %s", name)
                continue

            if response_text:
                model = "llama3"
                prompt = f"""You are a tag extractor for files. Your task is to extract at least 5 of the most relevant and general tags from the given text.

                Instructions:
                1. Use some of these tags if they fit the context: {", ".join(tags)}.
                2. Create new tags only if necessary and ensure they are representative of the text, but they need to be general.
                3. Avoid using connection words, numbers, or ranks.
                4. You will respond with: "Here are the tags:"

                The text to analyze is: {response_text}

                Your response (separated by commas, without any explaining or additional text, just the tags):"""

                logging.info("Response content: %s", response_text)

                response = post_request_llama3(client, model, prompt)
                if response:
                    logging.info("Tags for file %s: %s", name, response['message']['content'])
                    # send to the backend
                    response_tags: str = response['message']['content'].split(": ",1)[1].split(',')
                    #replace all non-alphanumeric characters
                    response_tags = [re.sub(r'[^a-zA-Z0-9]', '', tag).lower().strip() for tag in response_tags]
                    response_tags = list(set(response_tags))
                    
                    response = requests.post('http://next-app:3000/api/file/setHashTags', json={
                        'hash': file['hash'],
                        'tags': response_tags
                    })

                    if response.status_code == 200:
                        logging.info("File %s tagged successfully", name)
                    else:
                        logging.error("Failed to tag file %s, status code: %s", name, response.status_code)
                    
                else:
                    logging.error("No response content for file %s", name)
            else:
                logging.error("No response from Ollama API or file read error for file %s", name)

        except RequestException as e:
            logging.error("Request to Ollama API failed for file %s: %s", name, e)
        except Exception as e:
            logging.error("An error occurred for file %s: %s", name, e)

def run_ollama_script():
    logging.info("Initializing Ollama client")
    client = initialize_ollama_client()

    while True:
        try:
            # Fetch tags
            tags = fetch_tags()
            if tags == -1:
                logging.error("No response fetched")
                time.sleep(20)
                continue

            # Process files
            process_files(client, tags)
        
        except Exception as e:
            logging.error("An error occurred: %s", e)
        
        # Wait for 20 seconds before running again
        time.sleep(20)

app = Flask(__name__)

@app.route('/disk-usage', methods=['GET'])
def disk_usage():
    folder = '/srv/tusd-data/data'
    total, used, free = shutil.disk_usage(folder)

    return jsonify({
        'total': total,
        'used': used,
        'free': free
    })

def run_flask():
    app.run(host='0.0.0.0', port=5000)

if __name__ == '__main__':
    try:
        # Start the Flask server in a separate thread
        flask_thread = threading.Thread(target=run_flask, daemon=True)
        flask_thread.start()

        # Start the Ollama script in a separate thread
        ollama_thread = threading.Thread(target=run_ollama_script, daemon=True)
        ollama_thread.start()

        # Wait for both threads to complete
        flask_thread.join()
        ollama_thread.join()
        
    except Exception as e:
        logging.error("An error occurred during initialization: %s", e)

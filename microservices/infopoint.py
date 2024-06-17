import base64  # Module for encoding binary data to base64
import json  # Module for working with JSON data
import re  # Module for regular expressions
import shutil  # Module for high-level file operations
import threading  # Module for creating and managing threads
import time  # Module for time-related functions
import logging  # Module for logging messages
import requests  # Module for making HTTP requests
from flask import Flask, jsonify  # Flask framework for creating web applications
from ollama import Client  # Custom module for Ollama API client
from requests.exceptions import RequestException  # Exception handling for requests module

from PyPDF2 import PdfReader  # Module for reading PDF files
from docx import Document  # Module for reading Word documents

# Configure logging with INFO level and a specific format for log messages
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def encode_image_to_base64(image_path):
    """Encode the image to base64 format."""
    with open(image_path, "rb") as image_file:  # Open the image file in binary mode
        return base64.b64encode(image_file.read()).decode('utf-8')  # Encode and return the image content in base64 format

def post_request_ollama(client, model, prompt, image_path):
    """Send a request to the Ollama API using the client."""
    response = client.generate(
        model=model,
        prompt=prompt,
        images=[encode_image_to_base64(image_path)]  # Encode image and include in the request
    )
    return response

def post_request_llama3(client, model, prompt):
    """Send a request to the Ollama API using the client."""
    response = client.chat(
        model=model,
        messages=[{
            'role': 'user',  # Specify the role as 'user' for the message
            'content': prompt,  # Include the prompt text
        }]
    )
    return response

def fetch_tags():
    """Fetch tags from the /api/file/getAllTags endpoint."""
    try:
        response = requests.get('http://next-app:3000/api/file/getAllTags')  # Send GET request to fetch tags
        if response.status_code == 200:  # Check if the request was successful
            tags_data = response.json()  # Parse JSON response
            tags = [tag['name'] for tag in tags_data]  # Extract tag names from the response
            return tags
        else:
            logging.error("Failed to fetch tags, status code: %s", response.status_code)  # Log error if status code is not 200
            return -1
    except RequestException as e:
        logging.error("Error fetching tags: %s", e)  # Log exception if request fails
        return -1

def fetch_files():
    """Fetch files that need to be tagged from the /api/file/getUntaggedFiles endpoint."""
    try:
        response = requests.get('http://next-app:3000/api/file/getUntaggedFiles')  # Send GET request to fetch untagged files
        if response.status_code == 200:  # Check if the request was successful
            files = response.json()  # Parse JSON response
            return files
        else:
            logging.error("Failed to fetch files, status code: %s", response.status_code)  # Log error if status code is not 200
            return []
    except RequestException as e:
        logging.error("Error fetching files: %s", e)  # Log exception if request fails
        return []

def initialize_ollama_client():
    """Initialize the Ollama client and ensure required models are available."""
    client = Client(host='http://ollama:11434')  # Create an Ollama client with specified host

    # Ensure the 'llava' model is available
    try:
        client.show('llava')  # Check if 'llava' model is available
        logging.info("LLAVA FOUND")
    except:
        logging.info("LLAVA NOT FOUND, EXTRACTING..")
        client.pull('llava')  # Download 'llava' model if not available
        logging.info("LLAVA EXTRACTED")

    # Ensure the 'llama3' model is available
    try:
        client.show('llama3')  # Check if 'llama3' model is available
        logging.info("llama3 FOUND")
    except:
        logging.info("llama3 NOT FOUND, EXTRACTING..")
        client.pull('llama3')  # Download 'llama3' model if not available
        logging.info("llama3 EXTRACTED")

    return client

def read_file_content(file_path, name):
    """Read the content of a file based on its type."""
    try:
        if name.endswith('.txt') or name.endswith('.py'):  # Handle text and Python files
            with open(file_path, 'r') as file:  # Open file in read mode
                return file.read()  # Return file content
        elif name.endswith('.pdf'):  # Handle PDF files
            return read_pdf(file_path)
        elif name.endswith('.docx'):  # Handle Word documents
            return read_word(file_path)
        else:
            logging.error("Unsupported file format for file %s", file_path)  # Log error for unsupported formats
            return -2
    except Exception as e:
        logging.error("Error reading file %s: %s", file_path, e)  # Log exception if reading fails
        return None

def read_pdf(file_path):
    """Read content from a PDF file."""
    reader = PdfReader(file_path)  # Create a PDF reader object
    number_of_pages = len(reader.pages)  # Get the number of pages in the PDF
    text = ""
    for i in range(number_of_pages):  # Iterate over all pages
        page = reader.pages[i]  # Get the current page
        text += page.extract_text()  # Extract text from the page
    print(text)  # Print the extracted text
    return text

def read_word(file_path):
    """Read content from a Word file."""
    text = ""
    try:
        doc = Document(file_path)  # Create a Document object
        for paragraph in doc.paragraphs:  # Iterate over all paragraphs
            text += paragraph.text + "\n"  # Append paragraph text with a newline
    except Exception as e:
        logging.error("Error reading Word file %s: %s", file_path, e)  # Log exception if reading fails
    return text

def get_file_metadata(file_path):
    """Retrieve metadata for a file."""
    file_path = file_path + '.info'  # Append '.info' to the file path to get metadata file
    with open(file_path, 'r') as file:  # Open metadata file in read mode
        data = json.load(file)  # Parse JSON data from file
        return data
    
    return None

def process_files(client, tags):
    """Process the files to get tags using the Ollama API."""
    files = fetch_files()  # Fetch files to be processed
    if not files:
        logging.error("No files to process")  # Log error if no files are fetched
        return

    for file in files:  # Iterate over each file
        try:
            file_path = file['path']  # Get the file path from the file object
            file_path = f"/srv/tusd-data/data/{file_path}"  # Construct the full file path
            file_meta = get_file_metadata(file_path)  # Retrieve file metadata
            name = file_meta['MetaData']['filename']  # Get the original file name
            model = "llava"
            prompt = "Describe briefly this image, just the relevant parts:"

            # Handle image files
            if name.endswith('.jpg') or name.endswith('.jpeg') or name.endswith('.png'):
                logging.info("Sending request to Ollama API for image file: %s", file['hash'])
                response = post_request_ollama(client, model, prompt, file_path)
                response_text = response["response"] if response and response["response"] else None
            else:
                # Handle other file types
                logging.info("Reading content for file: %s", file['hash'])
                response_text = read_file_content(file_path, name)

            if response_text == -2:
                # If file format is unsupported, notify backend with empty tags
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
                    # Parse and clean the response tags
                    response_tags = response['message']['content'].split(": ", 1)[1].split(',')
                    response_tags = [re.sub(r'[^a-zA-Z0-9]', '', tag).lower().strip() for tag in response_tags]
                    response_tags = list(set(response_tags))
                    
                    # Send the tags to the backend
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
    """Run the Ollama script to process files periodically."""
    logging.info("Initializing Ollama client")
    client = initialize_ollama_client()  # Initialize the Ollama client

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

app = Flask(__name__)  # Create a Flask application

@app.route('/disk-usage', methods=['GET'])
def disk_usage():
    """Endpoint to check disk usage of a specific folder."""
    folder = '/srv/tusd-data/data'
    total, used, free = shutil.disk_usage(folder)  # Get disk usage statistics

    return jsonify({
        'total': total,
        'used': used,
        'free': free
    })

def run_flask():
    """Run the Flask server."""
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

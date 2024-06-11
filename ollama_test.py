import base64
import json
import requests
import ollama
from ollama import Client

def post_request_ollama(client, model, prompt, image_path):
    """Send a request to the Ollama API using the client."""
    response = client.chat(
        model=model,
        messages=[{
            'role': 'user',
            'content': prompt,
            'images': [image_path]
        }]
    )
    return response

# Main execution starts here
if __name__ == "__main__":
    # Image path
    image_path = "test_images/test2.jpeg"
    
    # Initialize the Ollama client
    client = Client(host='http://localhost:11434')
    
    # Ollama model and prompt
    model = "llava"
    prompt = "Given the tags: sad, puppy, square, golden retriever, sick, litter, burned, cute, fluffy, cats, dogs, red, purple, building, evil, demon. List at least 5 distinct single-word descriptors for this image, separated by commas. Use existing tags if possible; create new ones only if necessary. Avoid connection words, numbers, or ranks."
    
    # Send the request to Ollama API
    response = post_request_ollama(client, model, prompt, image_path)
    
    # Process the response
    if response:
        print("Response content:", response['message']['content'])
    else:
        print("Failed to get a valid response from the Ollama API.")

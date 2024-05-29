import base64
import json
import requests

def encode_image_to_base64(image_path):
    """Encode the image to base64 format."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def post_request(url, data, headers, stream=False):
    """Send a POST request to the specified URL."""
    try:
        response = requests.post(url, json=data, headers=headers, stream=stream)
        response.raise_for_status()  # This will raise an exception for HTTP errors
        return response
    except requests.exceptions.HTTPError as http_err:
        print(f'HTTP error occurred: {http_err}')
    except Exception as err:
        print(f'An error occurred: {err}')

def process_streaming_response(response):
    """Process each line in the streaming response."""
    final_response = ""
    try:
        for line in response.iter_lines():
            if line:  # filter out keep-alive new lines
                json_object = json.loads(line.decode('utf-8'))
                # print(json_object)
                final_response += json_object["response"]
                if json_object.get("done"):
                    print("Final response:", final_response)
                    return final_response
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON object: {e}")

# Main execution starts here
if __name__ == "__main__":
    # encoded_image = encode_image_to_base64("test_images/test1.jpg")
    encoded_image = encode_image_to_base64("test_images/test2.jpeg")
    # encoded_image = encode_image_to_base64("test_images/test3.jpeg")
    
    # API endpoints and headers
    url = 'http://localhost:11434/api/generate'
    pull_url = 'http://localhost:11434/api/pull'
    headers = {'Content-Type': 'application/json'}
    
    # Request data
    data = {
        "model": "llava",
        "prompt": "Given the tags: sad, puppy, square, golden retriever, sick, litter, burned, cute, fluffy, cats, dogs, red, purple, building, evil, demon. List at least 5 distinct single-word descriptors for this image, separated by commas. Use existing tags if possible; create new ones only if necessary. Avoid connection words, numbers, or ranks.",
        "images": [encoded_image]
    }
    
    # Send the initial request
    response = post_request(url, data, headers, stream=True)
    
    # Process the streaming response
    if response:
        final_response = process_streaming_response(response)
        if not final_response and response.status_code == 404:
            # Fallback to pull request if the initial request fails with 404
            response_pull = post_request(pull_url, {"name": "llava"}, headers, stream=True)
            if response_pull:
                process_streaming_response(response_pull)

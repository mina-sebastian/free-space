# Dockerfile

FROM python:3.11-slim

# Install necessary packages
RUN apt-get update && \
    apt-get install -y python3-pip

# Set up the Flask app
WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "infopoint.py"]

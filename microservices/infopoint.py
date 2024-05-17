from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/remaining-storage', methods=['GET'])
def remaining_storage():
    statvfs = os.statvfs('/srv/tusd-data/data')
    remaining_space = statvfs.f_frsize * statvfs.f_bavail
    remaining_space_gb = remaining_space / (1024 ** 3)  # Convert bytes to gigabytes
    print(f'Remaining storage: {remaining_space_gb:.2f} GB')
    return jsonify({'remaining_storage_gb': remaining_space_gb})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

import json
import os
from datetime import datetime
import uuid

METADATA_FILE = "metadata.json"

def load_metadata():
    if not os.path.exists(METADATA_FILE):
        return {"projects": {}, "files": {}}
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_metadata(metadata):
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, default=str)

# Project management
def create_project(name, description):
    metadata = load_metadata()
    project_id = str(uuid.uuid4())
    metadata["projects"][project_id] = {
        "projectId": project_id,
        "name": name,
        "description": description,
        "createdAt": datetime.utcnow().isoformat(),
        "status": "active"
    }
    save_metadata(metadata)
    return project_id

def list_projects():
    metadata = load_metadata()
    return list(metadata["projects"].values())

def delete_project(project_id):
    metadata = load_metadata()
    # Remove project
    metadata["projects"].pop(project_id, None)
    # Remove all files under this project
    metadata["files"] = {fid: f for fid, f in metadata["files"].items() if f["projectId"] != project_id}
    save_metadata(metadata)

# File management
def add_file(project_id, filename, filetype, size):
    metadata = load_metadata()
    file_id = str(uuid.uuid4())
    metadata["files"][file_id] = {
        "fileId": file_id,
        "projectId": project_id,
        "filename": filename,
        "type": filetype,
        "size": size,
        "uploadedAt": datetime.utcnow().isoformat(),
        "status": "processing"
    }
    save_metadata(metadata)
    return file_id

def list_files(project_id=None):
    metadata = load_metadata()
    files = list(metadata["files"].values())
    if project_id:
        files = [f for f in files if f["projectId"] == project_id]
    return files

def delete_file(file_id):
    metadata = load_metadata()
    metadata["files"].pop(file_id, None)
    save_metadata(metadata)

def update_file_status(file_id, status):
    metadata = load_metadata()
    if file_id in metadata["files"]:
        metadata["files"][file_id]["status"] = status
        save_metadata(metadata) 
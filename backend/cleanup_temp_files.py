import os
import time

TMP_DIR = "/tmp"
AGE_THRESHOLD = 60 * 60 * 24  # 24 hours

def cleanup_tmp_files():
    now = time.time()
    for fname in os.listdir(TMP_DIR):
        fpath = os.path.join(TMP_DIR, fname)
        if os.path.isfile(fpath):
            if now - os.path.getmtime(fpath) > AGE_THRESHOLD:
                try:
                    os.remove(fpath)
                    print(f"Deleted {fpath}")
                except Exception as e:
                    print(f"Failed to delete {fpath}: {e}")

if __name__ == "__main__":
    cleanup_tmp_files() 
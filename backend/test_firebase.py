from app.core.database import get_db

def test_firebase():
    db = get_db()
    print("Firebase DB initialized:", db)
    # Write a test document
    doc_ref = db.collection('test_collection').document('test_doc')
    doc_ref.set({'status': 'Firebase migration successful!'})
    print("Document written to Firestore!")

if __name__ == "__main__":
    test_firebase()

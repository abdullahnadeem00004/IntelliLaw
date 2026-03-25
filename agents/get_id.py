from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017")
db = client["intellilaw"]
case = db.cases.find_one({"caseNumber": "DEMO-2025-001"})
if case:
    print("Your case ID is:", case["_id"])
else:
    print("Inserting...")
    r = db.cases.insert_one({"title":"State vs Ahmed - Theft S.380 PPC","caseNumber":"DEMO-2025-001","category":"Criminal","priority":"HIGH","status":"ACTIVE","court":"Lahore Sessions Court","judge":"Justice Khalid Mahmood","clientName":"Muhammad Ahmed","assignedLawyerUid":"demo_lawyer","tags":["theft","PPC-380","lahore"],"description":"Client accused of theft under Section 380 PPC at DHA Phase 5 Lahore."})
    print("Your case ID is:", r.inserted_id)

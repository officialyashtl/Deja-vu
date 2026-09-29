import asyncio
import os
from hindsight_client import Hindsight

async def run_test():
    base_url = "http://localhost:8888"
    bank_id = "audittrail"
    api_key = "dummy_key"
    
    print(f"Connecting to Hindsight at {base_url} with bank {bank_id}...")
    client = Hindsight(base_url=base_url, api_key=api_key)
    
    try:
        # A-043 -> retain
        print("1. Retaining A-043...")
        content_a043 = "Finding A-043: Delayed access revocation. Category: Access Control. Status: Resolved. Resolution: Automated employee offboarding workflow."
        retain_res = await client.aretain(bank_id=bank_id, content=content_a043)
        print("   Success:", retain_res)
        
        # A-107 -> recall
        print("\n2. Recalling for A-107...")
        query_a107 = "Delayed Employee Access Revocation Access Control"
        recall_res = await client.arecall(bank_id=bank_id, query=query_a107)
        
        matches = getattr(recall_res, 'results', recall_res)
        if matches and len(matches) > 0:
            print("   Match found:", getattr(matches[0], 'content', matches[0]))
        else:
            print("   No matches found.")
            
        # A-107 resolved -> retain
        print("\n3. Retaining A-107 resolution...")
        content_a107_res = "Finding A-107 resolved: Configured auto-termination scripts for AD. Status: Resolved."
        retain_res_2 = await client.aretain(bank_id=bank_id, content=content_a107_res)
        print("   Success:", retain_res_2)
        
    except Exception as e:
        print("\nTest failed with error:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_test())

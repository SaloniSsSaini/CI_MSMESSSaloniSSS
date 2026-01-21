import pandas as pd

# Read the Excel file
df = pd.read_excel('samplesms.xlsx')

print(f"Total rows: {len(df)}")
print(f"Columns: {df.columns.tolist()}")

# Save analysis to file
with open('sms_analysis.txt', 'w', encoding='utf-8') as f:
    f.write(f"Total rows: {len(df)}\n")
    f.write(f"Columns: {df.columns.tolist()}\n\n")
    f.write("="*80 + "\n")
    f.write("ALL SMS MESSAGES\n")
    f.write("="*80 + "\n\n")
    
    for i, row in df.iterrows():
        sender = row['senderAddress']
        text = str(row['text']).replace('\n', ' ').replace('\r', ' ')
        f.write(f"{i+1}. [{sender}]\n{text}\n\n")

print("Analysis saved to sms_analysis.txt")

# Also print unique senders
print("\nUnique senders:")
for sender in df['senderAddress'].unique()[:50]:
    print(f"  - {sender}")

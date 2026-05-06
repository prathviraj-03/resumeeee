import os
import psycopg2
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load AI Service env for Cloudinary keys
load_dotenv('d:/PROJECT/RESUME-FORGE-X/SERVICRES/AI - service/ai-service/.env')

# Load Profile Service env for DB URL
load_dotenv('d:/PROJECT/RESUME-FORGE-X/SERVICRES/profile-service/.env', override=True)

# Cloudinary Config
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

def upload_and_seed():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found in profile-service/.env")
        return

    # Connection to profile_db
    # Strip query params like ?schema=public which psycopg2 doesn't handle in URI
    clean_url = db_url.split('?')[0].replace("postgresql://", "postgres://")
    conn = psycopg2.connect(clean_url)
    cur = conn.cursor()

    templates = [
        {
            "name": "Modern Minimalist (System)",
            "desc": "A clean, modern layout using blue accents and clear typography.",
            "path": "seeds/templates/Modern_Minimalist.docx"
        },
        {
            "name": "Executive Professional (System)",
            "desc": "Traditional layout designed for corporate and executive roles.",
            "path": "seeds/templates/Executive_Professional.docx"
        }
    ]

    for t in templates:
        print(f"Uploading {t['name']}...")
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            t['path'],
            resource_type="raw", # Important for DOCX
            folder="ai_resumes/system_templates",
            public_id=os.path.basename(t['path']).split('.')[0]
        )

        file_url = result['secure_url']
        public_id = result['public_id']
        file_size = result['bytes']

        # Check if already exists by name
        cur.execute("SELECT template_id FROM resume_templates WHERE name = %s", (t['name'],))
        exists = cur.fetchone()

        if exists:
            print(f"Updating {t['name']}...")
            cur.execute("""
                UPDATE resume_templates 
                SET file_url = %s, public_id = %s, file_size = %s, updated_at = NOW()
                WHERE name = %s
            """, (file_url, public_id, file_size, t['name']))
        else:
            print(f"Inserting {t['name']}...")
            cur.execute("""
                INSERT INTO resume_templates (template_id, user_id, name, description, file_url, public_id, file_size, is_default, created_at, updated_at)
                VALUES (gen_random_uuid(), NULL, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (t['name'], t['desc'], file_url, public_id, file_size, False))

    conn.commit()
    cur.close()
    conn.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    upload_and_seed()

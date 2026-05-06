import prisma from '../src/config/database.config';

async function main() {
  console.log('🌱 Seeding 4 default system templates...');

  const templates = [
    {
      template_id: 'sys-modern-professional',
      name: 'Modern Professional',
      description: 'A clean, minimalist DOCX template suitable for corporate and tech roles.',
      file_url: 'https://res.cloudinary.com/dnkhur6aj/raw/upload/templates/Modern_Minimalist.docx',
      public_id: 'templates/Modern_Minimalist',
      file_size: 36892,
      is_default: true,
      user_id: null,
    },
    {
      template_id: 'sys-creative-portfolio',
      name: 'Creative Portfolio',
      description: 'A vibrant layout designed for designers, marketers, and creative professionals.',
      file_url: 'https://res.cloudinary.com/dnkhur6aj/raw/upload/templates/Fresher_Modern.docx',
      public_id: 'templates/Fresher_Modern',
      file_size: 36901,
      is_default: false,
      user_id: null,
    },
    {
      template_id: 'sys-executive-brief',
      name: 'Executive Brief',
      description: 'A traditional, highly structured format favored by executives and finance professionals.',
      file_url: 'https://res.cloudinary.com/dnkhur6aj/raw/upload/templates/Executive_Professional.docx',
      public_id: 'templates/Executive_Professional',
      file_size: 36793,
      is_default: false,
      user_id: null,
    },
    {
      template_id: 'sys-tech-startup',
      name: 'Tech Startup',
      description: 'A dynamic, high-impact template emphasizing skills and projects for startups.',
      file_url: 'https://res.cloudinary.com/dnkhur6aj/raw/upload/templates/Fresher_Classic.docx',
      public_id: 'templates/Fresher_Classic',
      file_size: 36887,
      is_default: false,
      user_id: null,
    }
  ];

  for (const t of templates) {
    await prisma.resume_templates.upsert({
      where: { template_id: t.template_id },
      update: t as any,
      create: t as any,
    });
  }

  console.log('✅ Seeding complete. 4 System Templates added.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

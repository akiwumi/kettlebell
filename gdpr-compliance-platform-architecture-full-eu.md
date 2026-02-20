# GDPR Automated Compliance Service — Full Architecture & Build Instructions

## Project Overview

Build a multi-tenant SaaS platform that provides automated GDPR compliance services to businesses across all EU/EEA member states. The platform handles company onboarding with country-specific verified identity, data discovery, consent management, data subject request automation, breach management, vendor risk assessment, DPIA automation, continuous compliance monitoring, full multilingual support across all 24 EU official languages, and an AI-powered compliance assistant.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Authentication & Registration System](#authentication--registration-system)
5. [Company Verification System](#company-verification-system)
6. [EU Country Registry — Verification APIs & Business Registers](#eu-country-registry)
7. [EU Country Legal Framework — DPAs & National GDPR Implementation](#eu-country-legal-framework)
8. [Internationalization & Language System](#internationalization--language-system)
9. [AI Compliance Assistant](#ai-compliance-assistant)
10. [Core Modules](#core-modules)
11. [Security Safeguards](#security-safeguards)
12. [API Architecture](#api-architecture)
13. [Infrastructure & Deployment](#infrastructure--deployment)
14. [Testing Strategy](#testing-strategy)
15. [Build Order & Implementation Plan](#build-order--implementation-plan)

---

## Tech Stack

```
Frontend:         Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
Backend:          Node.js with Express or Fastify (API), Next.js API routes (BFF)
Database:         PostgreSQL (primary), Redis (caching/sessions/queues)
ORM:              Prisma
Auth:             NextAuth.js v5 + custom RBAC layer
Queue:            BullMQ (Redis-backed job queue)
File Storage:     AWS S3 (encrypted at rest, versioned)
Email:            Resend or AWS SES
Search:           Elasticsearch (for data discovery/audit log search)
ML/NLP:           Python microservice (spaCy/Presidio for PII detection)
AI Assistant:     Anthropic Claude API (claude-sonnet-4-20250514) + RAG pipeline
i18n:             next-intl (frontend), i18next (backend), Crowdin (translation management)
Monitoring:       Sentry (errors), Prometheus + Grafana (metrics)
CI/CD:            GitHub Actions
Infrastructure:   Docker, AWS ECS/Fargate or Kubernetes
CDN:              CloudFront
DNS:              Route 53
SSL:              AWS ACM (auto-renewed certificates)
Region:           AWS eu-central-1 (Frankfurt) primary, eu-west-1 (Ireland) failover
                  — All data stored within EU borders
```

---

## Project Structure

```
gdpr-compliance-platform/
├── apps/
│   ├── web/                          # Next.js frontend + BFF
│   │   ├── app/
│   │   │   ├── [locale]/             # ← i18n locale prefix for ALL routes
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   ├── verify-email/
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   └── reset-password/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── overview/
│   │   │   │   │   ├── data-mapping/
│   │   │   │   │   ├── consent/
│   │   │   │   │   ├── dsr/
│   │   │   │   │   ├── breaches/
│   │   │   │   │   ├── vendors/
│   │   │   │   │   ├── dpia/
│   │   │   │   │   ├── training/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── ai-assistant/     # AI compliance assistant
│   │   │   │   │   └── settings/
│   │   │   │   ├── (onboarding)/
│   │   │   │   │   ├── country-selection/    # EU country picker
│   │   │   │   │   ├── company-details/
│   │   │   │   │   ├── company-verification/
│   │   │   │   │   ├── questionnaire/
│   │   │   │   │   └── integrations/
│   │   │   │   └── (public)/
│   │   │   │       ├── consent/[orgSlug]/
│   │   │   │       └── dsr/[orgSlug]/
│   │   │   └── api/
│   │   │       ├── auth/
│   │   │       ├── webhooks/
│   │   │       ├── ai/                      # AI assistant API routes
│   │   │       └── v1/
│   │   ├── components/
│   │   │   ├── ui/                          # shadcn/ui components
│   │   │   ├── country-selector/
│   │   │   ├── language-switcher/
│   │   │   ├── ai-chat/                     # AI assistant chat widget
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── i18n/
│   │   │   │   ├── config.ts                # Locale configuration
│   │   │   │   ├── request.ts               # Server-side locale detection
│   │   │   │   └── navigation.ts            # Localized navigation helpers
│   │   │   └── ...
│   │   ├── messages/                        # Translation files
│   │   │   ├── en.json
│   │   │   ├── de.json
│   │   │   ├── fr.json
│   │   │   ├── es.json
│   │   │   ├── it.json
│   │   │   ├── nl.json
│   │   │   ├── pt.json
│   │   │   ├── pl.json
│   │   │   ├── ro.json
│   │   │   ├── el.json
│   │   │   ├── cs.json
│   │   │   ├── hu.json
│   │   │   ├── sv.json
│   │   │   ├── da.json
│   │   │   ├── fi.json
│   │   │   ├── sk.json
│   │   │   ├── bg.json
│   │   │   ├── hr.json
│   │   │   ├── lt.json
│   │   │   ├── lv.json
│   │   │   ├── et.json
│   │   │   ├── sl.json
│   │   │   ├── mt.json
│   │   │   ├── ga.json                     # Irish
│   │   │   ├── nb.json                     # Norwegian Bokmål (EEA)
│   │   │   └── is.json                     # Icelandic (EEA)
│   │   ├── middleware.ts                    # Locale detection + redirect
│   │   └── next.config.ts
│   │
│   ├── api/                          # Core API service
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── company-verification/
│   │   │   │   │   ├── providers/
│   │   │   │   │   │   ├── austria.provider.ts
│   │   │   │   │   │   ├── belgium.provider.ts
│   │   │   │   │   │   ├── bulgaria.provider.ts
│   │   │   │   │   │   ├── croatia.provider.ts
│   │   │   │   │   │   ├── cyprus.provider.ts
│   │   │   │   │   │   ├── czech-republic.provider.ts
│   │   │   │   │   │   ├── denmark.provider.ts
│   │   │   │   │   │   ├── estonia.provider.ts
│   │   │   │   │   │   ├── finland.provider.ts
│   │   │   │   │   │   ├── france.provider.ts
│   │   │   │   │   │   ├── germany.provider.ts
│   │   │   │   │   │   ├── greece.provider.ts
│   │   │   │   │   │   ├── hungary.provider.ts
│   │   │   │   │   │   ├── ireland.provider.ts
│   │   │   │   │   │   ├── italy.provider.ts
│   │   │   │   │   │   ├── latvia.provider.ts
│   │   │   │   │   │   ├── lithuania.provider.ts
│   │   │   │   │   │   ├── luxembourg.provider.ts
│   │   │   │   │   │   ├── malta.provider.ts
│   │   │   │   │   │   ├── netherlands.provider.ts
│   │   │   │   │   │   ├── poland.provider.ts
│   │   │   │   │   │   ├── portugal.provider.ts
│   │   │   │   │   │   ├── romania.provider.ts
│   │   │   │   │   │   ├── slovakia.provider.ts
│   │   │   │   │   │   ├── slovenia.provider.ts
│   │   │   │   │   │   ├── spain.provider.ts
│   │   │   │   │   │   ├── sweden.provider.ts
│   │   │   │   │   │   ├── norway.provider.ts       # EEA
│   │   │   │   │   │   ├── iceland.provider.ts       # EEA
│   │   │   │   │   │   ├── liechtenstein.provider.ts  # EEA
│   │   │   │   │   │   └── provider.interface.ts      # Common interface
│   │   │   │   │   ├── verification.service.ts
│   │   │   │   │   ├── verification.router.ts
│   │   │   │   │   └── verification.factory.ts        # Country → provider factory
│   │   │   │   ├── legal-framework/
│   │   │   │   │   ├── dpa-registry.ts               # All EU DPA details
│   │   │   │   │   ├── national-laws.ts              # Country-specific GDPR implementations
│   │   │   │   │   ├── breach-notification.ts         # Country-specific breach rules
│   │   │   │   │   ├── age-of-consent.ts             # Digital consent age per country
│   │   │   │   │   └── legal-framework.service.ts
│   │   │   │   ├── ai-assistant/
│   │   │   │   │   ├── assistant.service.ts
│   │   │   │   │   ├── assistant.router.ts
│   │   │   │   │   ├── rag/
│   │   │   │   │   │   ├── embeddings.service.ts
│   │   │   │   │   │   ├── vector-store.ts
│   │   │   │   │   │   └── document-loader.ts
│   │   │   │   │   ├── tools/
│   │   │   │   │   │   ├── compliance-checker.tool.ts
│   │   │   │   │   │   ├── dpia-generator.tool.ts
│   │   │   │   │   │   ├── policy-drafter.tool.ts
│   │   │   │   │   │   ├── breach-assessor.tool.ts
│   │   │   │   │   │   └── dsr-advisor.tool.ts
│   │   │   │   │   └── prompts/
│   │   │   │   │       ├── system-prompt.ts
│   │   │   │   │       └── country-specific-prompts.ts
│   │   │   │   ├── data-mapping/
│   │   │   │   ├── consent/
│   │   │   │   ├── dsr/
│   │   │   │   ├── breach/
│   │   │   │   ├── vendor/
│   │   │   │   ├── dpia/
│   │   │   │   ├── training/
│   │   │   │   ├── reporting/
│   │   │   │   └── notifications/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── rbac.middleware.ts
│   │   │   │   ├── rate-limit.middleware.ts
│   │   │   │   ├── audit-log.middleware.ts
│   │   │   │   ├── tenant.middleware.ts
│   │   │   │   ├── locale.middleware.ts           # Accept-Language + user preference
│   │   │   │   └── validation.middleware.ts
│   │   │   ├── lib/
│   │   │   │   ├── encryption.ts
│   │   │   │   ├── audit-logger.ts
│   │   │   │   ├── queue.ts
│   │   │   │   ├── storage.ts
│   │   │   │   └── i18n-backend.ts               # Backend translation loader
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── pii-detector/                 # Python microservice for PII detection
│       ├── app/
│       │   ├── detector.py
│       │   ├── classifier.py
│       │   ├── api.py
│       │   └── language_detector.py   # Detect PII language for correct NER model
│       ├── models/
│       │   ├── en/                    # English NER model
│       │   ├── de/                    # German NER model
│       │   ├── fr/                    # French NER model
│       │   ├── es/                    # Spanish NER model
│       │   ├── it/                    # Italian NER model
│       │   ├── nl/                    # Dutch NER model
│       │   ├── pt/                    # Portuguese NER model
│       │   ├── pl/                    # Polish NER model
│       │   └── multi/                 # Multilingual fallback model
│       └── requirements.txt
│
├── packages/
│   ├── database/                     # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   │       ├── eu-countries.ts            # Country reference data
│   │   │       ├── dpa-authorities.ts          # All EU DPAs
│   │   │       ├── national-laws.ts            # National GDPR implementations
│   │   │       ├── gdpr-articles.ts            # GDPR article text (all languages)
│   │   │       └── training-content.ts
│   │   └── package.json
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── country.types.ts
│   │   │   │   ├── verification.types.ts
│   │   │   │   ├── legal-framework.types.ts
│   │   │   │   ├── ai-assistant.types.ts
│   │   │   │   └── ...
│   │   │   ├── constants/
│   │   │   │   ├── eu-countries.ts             # Country codes, names, flags
│   │   │   │   ├── eu-languages.ts             # Language codes, names, directions
│   │   │   │   ├── dpa-authorities.ts          # DPA contact details
│   │   │   │   ├── gdpr-articles.ts
│   │   │   │   ├── lawful-bases.ts
│   │   │   │   ├── data-categories.ts
│   │   │   │   └── breach-severity.ts
│   │   │   └── utils/
│   │   └── package.json
│   ├── eu-legal-corpus/              # GDPR + national law text corpus for AI RAG
│   │   ├── gdpr/
│   │   │   ├── regulation-2016-679.json       # Full GDPR text (all languages)
│   │   │   ├── recitals.json
│   │   │   └── articles.json
│   │   ├── national/
│   │   │   ├── AT-dsg.json                    # Austria - Datenschutzgesetz
│   │   │   ├── BE-law-2018.json               # Belgium
│   │   │   ├── BG-lpdp.json                   # Bulgaria
│   │   │   ├── HR-law-2018.json               # Croatia
│   │   │   ├── CY-law-2018.json               # Cyprus
│   │   │   ├── CZ-act-110-2019.json           # Czech Republic
│   │   │   ├── DK-act-502-2018.json           # Denmark
│   │   │   ├── EE-ika-2019.json               # Estonia
│   │   │   ├── FI-tietosuojalaki-2018.json    # Finland
│   │   │   ├── FR-loi-informatique.json        # France
│   │   │   ├── DE-bdsg.json                   # Germany - Bundesdatenschutzgesetz
│   │   │   ├── DE-laender/                    # German state-level laws (16 states)
│   │   │   ├── GR-law-4624-2019.json          # Greece
│   │   │   ├── HU-act-cxii-2011.json          # Hungary
│   │   │   ├── IE-data-protection-2018.json   # Ireland
│   │   │   ├── IT-d-lgs-196-2003.json         # Italy
│   │   │   ├── LV-law-2018.json               # Latvia
│   │   │   ├── LT-law-2018.json               # Lithuania
│   │   │   ├── LU-law-2018.json               # Luxembourg
│   │   │   ├── MT-act-2018.json               # Malta
│   │   │   ├── NL-uavg-2018.json              # Netherlands
│   │   │   ├── PL-act-2018.json               # Poland
│   │   │   ├── PT-law-58-2019.json            # Portugal
│   │   │   ├── RO-law-190-2018.json           # Romania
│   │   │   ├── SK-act-18-2018.json            # Slovakia
│   │   │   ├── SI-zvop-2.json                 # Slovenia
│   │   │   ├── ES-lopdgdd.json                # Spain
│   │   │   ├── SE-dataskyddslag-2018.json      # Sweden
│   │   │   ├── NO-personopplysningsloven.json  # Norway (EEA)
│   │   │   ├── IS-act-90-2018.json            # Iceland (EEA)
│   │   │   └── LI-dsg-2018.json               # Liechtenstein (EEA)
│   │   ├── guidance/                          # DPA guidance documents
│   │   │   ├── edpb/                          # European Data Protection Board
│   │   │   └── national/                      # Country-specific DPA guidance
│   │   └── embeddings/                        # Pre-computed vector embeddings
│   │       └── .gitkeep
│   │
│   └── consent-sdk/                  # JavaScript SDK for cookie banners
│       ├── src/
│       │   ├── banner.ts
│       │   ├── preferences.ts
│       │   ├── api.ts
│       │   └── i18n/                  # Banner translations (24 languages)
│       │       ├── en.json
│       │       ├── de.json
│       │       └── ...
│       └── package.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.pii
│   │   ├── Dockerfile.ai-worker       # AI assistant worker
│   │   └── docker-compose.yml
│   ├── terraform/
│   └── k8s/
│
├── scripts/
│   ├── seed-gdpr-rules.ts
│   ├── seed-eu-countries.ts
│   ├── seed-dpa-authorities.ts
│   ├── seed-national-laws.ts
│   ├── seed-training-content.ts
│   ├── generate-encryption-keys.ts
│   ├── build-legal-embeddings.ts      # Build RAG vector store
│   └── sync-translations.ts           # Pull from Crowdin
│
├── turbo.json
├── package.json
└── .env.example
```

---

## Database Schema

### Core Tables

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================

model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  passwordHash          String
  firstName             String
  lastName              String
  preferredLanguage     String    @default("en")  // ISO 639-1 language code
  emailVerified         Boolean   @default(false)
  emailVerifiedAt       DateTime?
  emailVerificationToken String?  @unique
  passwordResetToken    String?   @unique
  passwordResetExpires  DateTime?
  mfaEnabled            Boolean   @default(false)
  mfaSecret             String?
  mfaBackupCodes        String[]
  lastLoginAt           DateTime?
  lastLoginIp           String?
  failedLoginAttempts   Int       @default(0)
  lockedUntil           DateTime?
  isActive              Boolean   @default(true)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  organizationMemberships OrganizationMember[]
  sessions                Session[]
  auditLogs               AuditLog[]
  aiConversations         AiConversation[]

  @@index([email])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  ipAddress    String
  userAgent    String
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([token])
  @@index([userId])
}

// ============================================================
// ORGANIZATION (TENANT) & COMPANY VERIFICATION
// ============================================================

model Organization {
  id                   String    @id @default(cuid())
  name                 String
  slug                 String    @unique
  legalName            String?
  registrationNumber   String?
  vatNumber            String?
  registeredCountry    String?   // ISO 3166-1 alpha-2 — determines verification provider + DPA + legal framework
  registeredAddress    Json?     // { line1, line2, city, region, postalCode, country }
  tradingAddress       Json?
  industry             String?
  companySize          String?
  websiteUrl           String?
  dpoEmail             String?
  dpoName              String?
  primaryLanguage      String    @default("en")  // org's primary language for generated docs

  // Verification status
  verificationStatus   CompanyVerificationStatus @default(PENDING)
  verificationMethod   String?
  verificationData     Json?
  verifiedAt           DateTime?
  verificationNotes    String?

  // Address verification
  addressVerified      Boolean   @default(false)
  addressVerifiedAt    DateTime?
  addressVerificationMethod String?

  // Country-specific legal context
  applicableDpaId      String?   // links to the DPA for this country
  applicableDpa        DpaAuthority? @relation(fields: [applicableDpaId], references: [id])
  nationalLawReference String?   // reference to the national GDPR implementation
  digitalConsentAge    Int?      // age of digital consent in this country (13-16)

  // Platform status
  onboardingCompleted  Boolean   @default(false)
  subscriptionTier     String    @default("trial")
  subscriptionStatus   String    @default("active")
  trialEndsAt          DateTime?
  complianceScore      Int?
  lastAssessmentAt     DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  members              OrganizationMember[]
  dataAssets           DataAsset[]
  processingActivities ProcessingActivity[]
  consentRecords       ConsentRecord[]
  dsrRequests          DsrRequest[]
  breachIncidents      BreachIncident[]
  vendors              Vendor[]
  dpias                Dpia[]
  trainingRecords      TrainingRecord[]
  auditLogs            AuditLog[]
  companyDocuments     CompanyDocument[]
  integrations         Integration[]
  consentConfigs       ConsentConfig[]
  aiConversations      AiConversation[]

  @@index([slug])
  @@index([registrationNumber])
  @@index([registeredCountry])
}

enum CompanyVerificationStatus {
  PENDING
  IN_PROGRESS
  VERIFIED
  REJECTED
  REQUIRES_MANUAL_REVIEW
  EXPIRED
}

// ============================================================
// EU COUNTRY REFERENCE DATA
// ============================================================

model EuCountry {
  id                  String   @id // ISO 3166-1 alpha-2 code (e.g., "DE", "FR")
  name                String   // English name
  localName           String   // Name in local language
  officialLanguages   String[] // ISO 639-1 codes
  isEuMember          Boolean  @default(true)
  isEeaMember         Boolean  @default(true)
  joinedGdpr          DateTime // When GDPR became applicable
  currencyCode        String?
  callingCode         String?
  flagEmoji           String?

  // Company registration specifics
  registrationNumberFormat String?    // Regex pattern for validation
  registrationNumberLabel  String?    // What it's called locally (e.g., "Handelsregisternummer", "SIRET")
  vatNumberPrefix    String?          // Country VAT prefix (e.g., "DE", "FR")
  businessRegisterUrl String?         // URL to the national register
  businessRegisterApi String?         // API endpoint if available

  // Legal framework
  digitalConsentAge  Int       @default(16) // Art. 8 — can be lowered to 13
  nationalLawName    String?               // Name of national GDPR implementation
  nationalLawUrl     String?               // Official publication URL

  dpaAuthority       DpaAuthority?
  verificationConfig CountryVerificationConfig?

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model DpaAuthority {
  id              String   @id @default(cuid())
  countryCode     String   @unique
  country         EuCountry @relation(fields: [countryCode], references: [id])
  name            String   // Official name (e.g., "Bundesbeauftragte für den Datenschutz")
  nameEnglish     String   // English name
  abbreviation    String?  // (e.g., "BfDI", "CNIL", "ICO")
  website         String
  complaintUrl    String?  // Direct URL for filing complaints
  breachNotificationUrl String? // URL/portal for breach notifications
  breachNotificationEmail String?
  breachNotificationForm  String?  // If online form exists
  contactEmail    String?
  contactPhone    String?
  contactAddress  Json?    // Full postal address
  guidanceUrl     String?  // URL for published guidance

  // Notification specifics
  breachNotificationLanguage String?       // Required language for notifications
  breachFormRequiresTranslation Boolean @default(false) // Must notification be in local language?
  onlineBreachPortal Boolean @default(false) // Has an online breach reporting portal?

  organizations   Organization[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model CountryVerificationConfig {
  id                    String   @id @default(cuid())
  countryCode           String   @unique
  country               EuCountry @relation(fields: [countryCode], references: [id])

  // Primary verification provider
  primaryProvider       String   // "companies_house", "handelsregister", "infogreffe", etc.
  primaryApiEndpoint    String?
  primaryApiKeyEnvVar   String?  // env variable name for API key
  primaryApiDocs        String?  // documentation URL

  // Secondary/fallback provider
  secondaryProvider     String?  // "opencorporates", "orbis", etc.
  secondaryApiEndpoint  String?

  // Address verification provider
  addressProvider       String   @default("google_places")
  addressApiEndpoint    String?

  // VAT validation
  vatValidationMethod   String   @default("vies") // "vies" for all EU countries

  // Required documents for manual verification
  requiredDocuments     Json?    // ["certificate_of_incorporation", "proof_of_address", ...]
  acceptedDocumentTypes Json?    // Locale-specific doc names

  // Registration number validation
  registrationNumberRegex String? // Validation pattern
  registrationNumberExample String? // Example for UI placeholder

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// ============================================================
// AI ASSISTANT
// ============================================================

model AiConversation {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title           String?
  language        String   @default("en")
  context         Json?    // Org-specific context injected into prompts
  status          String   @default("active") // "active", "archived"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  messages        AiMessage[]

  @@index([organizationId])
  @@index([userId])
}

model AiMessage {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role            String   // "user", "assistant", "system"
  content         String
  toolCalls       Json?    // If AI used tools (compliance check, DPIA draft, etc.)
  toolResults     Json?    // Results of tool calls
  tokensUsed      Int?
  model           String?  // Model version used
  createdAt       DateTime @default(now())

  @@index([conversationId])
}

// ============================================================
// COMPANY DOCUMENTS
// ============================================================

model CompanyDocument {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  documentType    String
  fileName        String
  fileKey         String
  mimeType        String
  fileSize        Int
  verificationStatus String @default("pending")
  reviewNotes     String?
  uploadedBy      String
  createdAt       DateTime @default(now())

  @@index([organizationId])
}

model OrganizationMember {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role            OrgRole  @default(MEMBER)
  invitedBy       String?
  invitedAt       DateTime?
  acceptedAt      DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}

enum OrgRole {
  OWNER
  ADMIN
  DPO
  COMPLIANCE_MANAGER
  MEMBER
  VIEWER
}

// ============================================================
// DATA MAPPING & PROCESSING ACTIVITIES
// (same as original — omitted for brevity, refer to original schema)
// ============================================================

// ============================================================
// CONSENT, DSR, BREACH, VENDOR, DPIA, TRAINING, INTEGRATION, AUDIT LOG
// (same as original — omitted for brevity, refer to original schema)
// ============================================================
```

---

## Authentication & Registration System

### Registration Flow with Country Selection

```
Step 1: Language Selection
├── Auto-detect from browser Accept-Language header
├── Display language picker (24 EU languages + English)
├── Persist selection in cookie + localStorage
└── All subsequent screens render in selected language

Step 2: Country Selection
├── Display EU/EEA country grid with flags
│   (27 EU + 3 EEA = 30 countries)
├── User selects their company's country of registration
├── Country selection determines:
│   ├── Which business register API to call
│   ├── Registration number format and validation
│   ├── VAT number prefix and validation
│   ├── Applicable DPA authority
│   ├── National GDPR implementation specifics
│   ├── Digital consent age (13-16)
│   ├── Required verification documents
│   └── Default language for compliance documents
└── Country is stored on Organization record

Step 3: User Registration
├── Email + password (min 12 chars, complexity requirements)
├── First name, last name
├── Password hashed with argon2id
├── Email verification token generated
├── Verification email sent in user's selected language
└── Account created in UNVERIFIED state

Step 4: Email Verification
├── User clicks link → token validated → emailVerified = true
└── Redirected to onboarding in their language

Step 5: Organization Setup
├── Legal company name
├── Registration number (format validated per country)
├── VAT number (optional, validated via VIES)
├── Registered address (with country-specific address format)
├── Trading address (if different)
└── Company size, industry, website

Step 6: Company Verification (automated per country — see next section)

Step 7: Onboarding Questionnaire
├── Country-aware questions (national law specifics)
├── Generates initial compliance gap report
└── Links to relevant DPA guidance in user's language
```

### Authentication Implementation

```typescript
// Same as original document — password policy, session config, MFA, rate limiting, lockout
// See original auth section — all applies unchanged

// ADDITIONAL: Locale-aware auth
const AUTH_EMAILS = {
  verification: 'auth.verification',      // i18n key
  passwordReset: 'auth.password-reset',
  accountLocked: 'auth.account-locked',
  mfaEnabled: 'auth.mfa-enabled',
  loginFromNewDevice: 'auth.new-device',
};

// All auth emails sent in user's preferredLanguage
// Email templates exist in all 24 languages
// Subject lines and body text pulled from translation files
```

### RBAC Matrix

```typescript
// Same as original document — all permissions apply unchanged
// See original RBAC section

// ADDITIONAL permissions for new modules:
export const ADDITIONAL_PERMISSIONS = {
  'ai.assistant.use':        ['OWNER', 'ADMIN', 'DPO', 'COMPLIANCE_MANAGER', 'MEMBER'],
  'ai.assistant.history':    ['OWNER', 'ADMIN', 'DPO'],
  'legal.framework.read':    ['OWNER', 'ADMIN', 'DPO', 'COMPLIANCE_MANAGER', 'MEMBER', 'VIEWER'],
  'org.language.change':     ['OWNER', 'ADMIN'],
  'org.country.change':      ['OWNER'],  // Rare — triggers re-verification
};
```

---

## Company Verification System

### Country-Aware Verification Architecture

```
User selects country during onboarding
         │
         ▼
┌─────────────────────────┐
│ VerificationFactory      │
│ .getProvider(countryCode) │ ← Looks up CountryVerificationConfig
└────────────┬────────────┘
             │
    ┌────────┼────────────────────────────┐
    │        │        │        │          │
    ▼        ▼        ▼        ▼          ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  ┌──────────┐
│  AT  │ │  DE  │ │  FR  │ │  NL  │  │ Fallback │
│ FBN  │ │ HR   │ │Infogrefe│ │KVK │  │OpenCorp  │
└──────┘ └──────┘ └──────┘ └──────┘  └──────────┘
    │        │        │        │          │
    └────────┴────────┴────────┴──────────┘
             │
             ▼
    ┌─────────────────┐
    │ Unified Result   │
    │ { status,        │
    │   confidence,    │
    │   checks[] }     │
    └─────────────────┘
             │
             ▼
    ┌─────────────────┐         ┌────────────────┐
    │ VIES VAT Check   │────────▶│ EU-wide VAT    │
    │ (all EU countries)│        │ validation     │
    └─────────────────┘         └────────────────┘
             │
             ▼
    ┌─────────────────┐         ┌────────────────┐
    │ Address Verify   │────────▶│ Google Places / │
    │                  │        │ country-specific│
    └─────────────────┘         └────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Verification     │
    │ Decision         │
    │ ≥80 → Auto OK    │
    │ 50-79 → Manual   │
    │ <50 → Rejected   │
    └─────────────────┘
```

### Provider Interface

```typescript
// apps/api/src/modules/company-verification/providers/provider.interface.ts

export interface CompanyVerificationProvider {
  countryCode: string;
  providerName: string;

  // Search for a company by registration number
  lookupByRegistrationNumber(regNumber: string): Promise<CompanyLookupResult | null>;

  // Search for a company by name (fallback)
  searchByName(companyName: string): Promise<CompanyLookupResult[]>;

  // Validate the format of a registration number
  validateRegistrationNumberFormat(regNumber: string): boolean;

  // Get the registration number label for this country
  getRegistrationNumberLabel(locale: string): string;

  // Get placeholder/example for UI
  getRegistrationNumberPlaceholder(): string;
}

export interface CompanyLookupResult {
  registrationNumber: string;
  legalName: string;
  tradingName?: string;
  status: 'active' | 'dissolved' | 'liquidation' | 'other';
  registeredAddress: Address;
  incorporationDate?: string;
  companyType?: string;     // "limited", "plc", "gmbh", "sarl", etc.
  directors?: Person[];
  registeredCapital?: string;
  source: string;           // Which API provided this data
  rawResponse: unknown;     // Full API response for audit
}
```

---

## EU Country Registry — Verification APIs & Business Registers

### Complete EU/EEA Country Verification Configuration

```typescript
// packages/shared/src/constants/eu-countries.ts

export const EU_COUNTRY_VERIFICATION: Record<string, CountryVerificationEntry> = {

  // ================================================================
  // AUSTRIA (AT)
  // ================================================================
  AT: {
    country: 'Austria',
    localName: 'Österreich',
    officialLanguages: ['de'],
    digitalConsentAge: 14,
    flag: '🇦🇹',

    businessRegister: {
      name: 'Firmenbuch (Commercial Register)',
      authority: 'Austrian Federal Ministry of Justice',
      website: 'https://www.justiz.gv.at/firmenbuch',
      apiProvider: 'OpenCorporates', // No free public API; use OpenCorporates or direct scraping
      apiEndpoint: 'https://api.opencorporates.com/v0.4/companies/at/{reg_number}',
      alternativeApi: 'https://firmen.wko.at/', // WKO company search
      registrationNumberLabel: 'Firmenbuchnummer (FN)',
      registrationNumberFormat: /^FN\s?\d{1,6}[a-z]$/i,
      registrationNumberExample: 'FN 123456a',
      notes: 'Firmenbuch has no free public API. Use OpenCorporates or the paid USP (Unternehmensserviceportal) API.'
    },

    vatValidation: {
      prefix: 'ATU',
      format: /^ATU\d{8}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'Austrian Post Address API',
    },

    requiredDocuments: [
      'firmenbuchauszug',          // Commercial register extract
      'gewerbeberechtigung',       // Trade license (if applicable)
    ],
  },

  // ================================================================
  // BELGIUM (BE)
  // ================================================================
  BE: {
    country: 'Belgium',
    localName: 'België / Belgique / Belgien',
    officialLanguages: ['nl', 'fr', 'de'],
    digitalConsentAge: 13,
    flag: '🇧🇪',

    businessRegister: {
      name: 'Crossroads Bank for Enterprises (CBE / KBO / BCE)',
      authority: 'FPS Economy',
      website: 'https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html',
      apiProvider: 'CBE Public Search',
      apiEndpoint: 'https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer={enterprise_number}',
      openDataApi: 'https://opendata.economie.fgov.be/',
      registrationNumberLabel: 'Enterprise Number (Ondernemingsnummer / Numéro d\'entreprise)',
      registrationNumberFormat: /^(BE)?0?\d{3}\.?\d{3}\.?\d{3}$/,
      registrationNumberExample: '0123.456.789',
      notes: 'CBE open data available as bulk download. Real-time lookup via web scraping or OpenCorporates.'
    },

    vatValidation: {
      prefix: 'BE',
      format: /^BE0\d{9}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'bpost address validation',
    },

    requiredDocuments: [
      'extrait_bce',               // CBE extract
      'statuts_coordonnes',        // Coordinated articles of association
    ],
  },

  // ================================================================
  // BULGARIA (BG)
  // ================================================================
  BG: {
    country: 'Bulgaria',
    localName: 'България',
    officialLanguages: ['bg'],
    digitalConsentAge: 14,
    flag: '🇧🇬',

    businessRegister: {
      name: 'Commercial Register (Търговски регистър)',
      authority: 'Registry Agency',
      website: 'https://portal.registryagency.bg/CR/en/Reports/VerificationPersonOrg',
      apiProvider: 'Registry Agency Portal',
      apiEndpoint: 'https://portal.registryagency.bg/CR/api/', // Limited API
      registrationNumberLabel: 'UIC (ЕИК — Единен идентификационен код)',
      registrationNumberFormat: /^\d{9,13}$/,
      registrationNumberExample: '123456789',
      notes: 'Free public search available on portal. No robust API — use OpenCorporates as fallback.'
    },

    vatValidation: {
      prefix: 'BG',
      format: /^BG\d{9,10}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
    },

    requiredDocuments: [
      'commercial_register_extract',
      'certificate_of_current_status',
    ],
  },

  // ================================================================
  // CROATIA (HR)
  // ================================================================
  HR: {
    country: 'Croatia',
    localName: 'Hrvatska',
    officialLanguages: ['hr'],
    digitalConsentAge: 16,
    flag: '🇭🇷',

    businessRegister: {
      name: 'Court Register (Sudski registar)',
      authority: 'Ministry of Justice',
      website: 'https://sudreg.pravosudje.hr/registar/f?p=150:1',
      apiProvider: 'Court Register Portal',
      apiEndpoint: null, // No public API
      registrationNumberLabel: 'OIB (Osobni identifikacijski broj)',
      registrationNumberFormat: /^\d{11}$/,
      registrationNumberExample: '12345678901',
      notes: 'Web search only. Use OpenCorporates as primary provider.'
    },

    vatValidation: {
      prefix: 'HR',
      format: /^HR\d{11}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
    },

    requiredDocuments: [
      'izvadak_iz_sudskog_registra',  // Court register extract
    ],
  },

  // ================================================================
  // CYPRUS (CY)
  // ================================================================
  CY: {
    country: 'Cyprus',
    localName: 'Κύπρος / Kıbrıs',
    officialLanguages: ['el', 'tr'],
    digitalConsentAge: 14,
    flag: '🇨🇾',

    businessRegister: {
      name: 'Department of Registrar of Companies',
      authority: 'Ministry of Energy, Commerce and Industry',
      website: 'https://efiling.drcor.mcit.gov.cy/DrcorPublic/SearchForm.aspx',
      apiProvider: 'DRCOR eFiling Portal',
      apiEndpoint: null,
      registrationNumberLabel: 'Registration Number (Αριθμός Εγγραφής)',
      registrationNumberFormat: /^(HE|ΗΕ)\d{1,6}$/i,
      registrationNumberExample: 'HE 123456',
      notes: 'No public API. Web scraping or OpenCorporates required.'
    },

    vatValidation: {
      prefix: 'CY',
      format: /^CY\d{8}[A-Z]$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
    },

    requiredDocuments: [
      'certificate_of_incorporation',
      'certificate_of_registered_office',
    ],
  },

  // ================================================================
  // CZECH REPUBLIC (CZ)
  // ================================================================
  CZ: {
    country: 'Czech Republic',
    localName: 'Česká republika',
    officialLanguages: ['cs'],
    digitalConsentAge: 15,
    flag: '🇨🇿',

    businessRegister: {
      name: 'Commercial Register (Obchodní rejstřík)',
      authority: 'Ministry of Justice',
      website: 'https://or.justice.cz/ias/ui/rejstrik',
      apiProvider: 'ARES (Administrative Register of Economic Subjects)',
      apiEndpoint: 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}',
      apiDocs: 'https://ares.gov.cz/swagger-ui/',
      registrationNumberLabel: 'IČO (Identifikační číslo osoby)',
      registrationNumberFormat: /^\d{8}$/,
      registrationNumberExample: '12345678',
      notes: 'ARES is a FREE public REST API. Excellent data quality. Primary provider for CZ.'
    },

    vatValidation: {
      prefix: 'CZ',
      format: /^CZ\d{8,10}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'RUIAN (Czech address register)',
    },

    requiredDocuments: [
      'vypis_z_obchodniho_rejstriku',  // Commercial register extract
    ],
  },

  // ================================================================
  // DENMARK (DK)
  // ================================================================
  DK: {
    country: 'Denmark',
    localName: 'Danmark',
    officialLanguages: ['da'],
    digitalConsentAge: 13,
    flag: '🇩🇰',

    businessRegister: {
      name: 'Danish Business Authority (Erhvervsstyrelsen) — CVR',
      authority: 'Danish Business Authority',
      website: 'https://datacvr.virk.dk/data/',
      apiProvider: 'CVR API',
      apiEndpoint: 'https://cvrapi.dk/api?country=dk&vat={cvr_number}',
      publicApi: 'http://distribution.virk.dk/',
      apiDocs: 'https://cvrapi.dk/documentation',
      registrationNumberLabel: 'CVR Number (CVR-nummer)',
      registrationNumberFormat: /^\d{8}$/,
      registrationNumberExample: '12345678',
      notes: 'FREE public API (cvrapi.dk). Also official Virk.dk distribution API. Excellent data quality.'
    },

    vatValidation: {
      prefix: 'DK',
      format: /^DK\d{8}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'DAWA (Danish Address Web API) — https://dawadocs.dataforsyningen.dk/',
    },

    requiredDocuments: [
      'cvr_extract',
    ],
  },

  // ================================================================
  // ESTONIA (EE)
  // ================================================================
  EE: {
    country: 'Estonia',
    localName: 'Eesti',
    officialLanguages: ['et'],
    digitalConsentAge: 13,
    flag: '🇪🇪',

    businessRegister: {
      name: 'Centre of Registers and Information Systems (e-Business Register)',
      authority: 'Ministry of Justice',
      website: 'https://ariregister.rik.ee/eng',
      apiProvider: 'e-Business Register API',
      apiEndpoint: 'https://ariregister.rik.ee/est/api/autocomplete?q={query}',
      registrationNumberLabel: 'Registry Code (Registrikood)',
      registrationNumberFormat: /^\d{8}$/,
      registrationNumberExample: '12345678',
      notes: 'Free search available. API access for programmatic queries. Estonia is very digital-first.'
    },

    vatValidation: {
      prefix: 'EE',
      format: /^EE\d{9}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'ADS (Estonian Address Data System)',
    },

    requiredDocuments: [
      'registrikaart',  // Registry card
    ],
  },

  // ================================================================
  // FINLAND (FI)
  // ================================================================
  FI: {
    country: 'Finland',
    localName: 'Suomi',
    officialLanguages: ['fi', 'sv'],
    digitalConsentAge: 13,
    flag: '🇫🇮',

    businessRegister: {
      name: 'Finnish Patent and Registration Office (PRH) — BIS/YTJ',
      authority: 'PRH & Finnish Tax Administration',
      website: 'https://www.ytj.fi/en/',
      apiProvider: 'YTJ API (Business Information System)',
      apiEndpoint: 'https://avoindata.prh.fi/opendata-ytj-api.html',
      apiDocs: 'https://avoindata.prh.fi/ytj.html',
      registrationNumberLabel: 'Business ID (Y-tunnus)',
      registrationNumberFormat: /^\d{7}-\d$/,
      registrationNumberExample: '1234567-8',
      notes: 'FREE open data API. Excellent documentation. Primary provider for FI.'
    },

    vatValidation: {
      prefix: 'FI',
      format: /^FI\d{8}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
    },

    requiredDocuments: [
      'kaupparekisteriote',  // Trade register extract
    ],
  },

  // ================================================================
  // FRANCE (FR)
  // ================================================================
  FR: {
    country: 'France',
    localName: 'France',
    officialLanguages: ['fr'],
    digitalConsentAge: 15,
    flag: '🇫🇷',

    businessRegister: {
      name: 'Registre National des Entreprises (RNE) / INSEE SIRENE',
      authority: 'INPI (Institut National de la Propriété Industrielle) / INSEE',
      website: 'https://www.inpi.fr/le-registre-national-des-entreprises',
      apiProvider: 'SIRENE API (INSEE)',
      apiEndpoint: 'https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret}',
      apiDocs: 'https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3.11&provider=insee',
      alternativeApi: 'https://entreprise.api.gouv.fr/', // API Entreprise (restricted)
      openDataApi: 'https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/', // Bulk download
      registrationNumberLabel: 'SIREN / SIRET',
      registrationNumberFormat: /^(\d{9}|\d{14})$/,  // SIREN=9 digits, SIRET=14 digits
      registrationNumberExample: 'SIREN: 123456789 / SIRET: 12345678901234',
      notes: 'SIRENE API is FREE but requires registration for API token. Rate limited. API Entreprise has more data but restricted to authorized use.'
    },

    vatValidation: {
      prefix: 'FR',
      format: /^FR[A-Z0-9]{2}\d{9}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'API Adresse (Base Adresse Nationale) — https://adresse.data.gouv.fr/api-doc/adresse — FREE',
    },

    requiredDocuments: [
      'kbis',                      // Extrait Kbis (official company registration certificate)
      'avis_situation_sirene',     // INSEE situation notice
    ],
  },

  // ================================================================
  // GERMANY (DE)
  // ================================================================
  DE: {
    country: 'Germany',
    localName: 'Deutschland',
    officialLanguages: ['de'],
    digitalConsentAge: 16,
    flag: '🇩🇪',

    businessRegister: {
      name: 'Handelsregister (Commercial Register)',
      authority: 'Federal/State Courts',
      website: 'https://www.handelsregister.de/',
      apiProvider: 'Handelsregister.de',
      apiEndpoint: null, // No free API — requires EGVP/XJustiz access
      alternativeApi: 'https://offeneregister.de/api/v1/company/{id}', // OffeneRegister (community API)
      openCorporatesEndpoint: 'https://api.opencorporates.com/v0.4/companies/de/{reg_number}',
      registrationNumberLabel: 'Handelsregisternummer',
      registrationNumberFormat: /^(HRA|HRB)\s?\d{1,6}(\s?[A-Z])?$/i,
      registrationNumberExample: 'HRB 12345',
      notes: `Germany has 16 state-level courts maintaining registers. No unified free API.
              OffeneRegister.de is a community project with limited data.
              OpenCorporates is the best aggregator. For premium: use North Data or Bundesanzeiger.
              Handelsregister.de offers paid document retrieval.
              IMPORTANT: German companies can be HRB (GmbH, AG, UG) or HRA (OHG, KG).
              Must also specify the court (Amtsgericht) for full identification.`
    },

    vatValidation: {
      prefix: 'DE',
      format: /^DE\d{9}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'Deutsche Post DATAFACTORY',
    },

    requiredDocuments: [
      'handelsregisterauszug',     // Commercial register extract
      'gewerbeanmeldung',          // Business registration (for Einzelunternehmen)
    ],

    // Germany-specific: 16 state DPAs in addition to federal
    stateLevelDpas: true,
  },

  // ================================================================
  // GREECE (GR)
  // ================================================================
  GR: {
    country: 'Greece',
    localName: 'Ελλάδα',
    officialLanguages: ['el'],
    digitalConsentAge: 15,
    flag: '🇬🇷',

    businessRegister: {
      name: 'General Electronic Commercial Registry (GEMI / Γ.Ε.ΜΗ.)',
      authority: 'Ministry of Development and Investment',
      website: 'https://www.businessregistry.gr/publicity/index',
      apiProvider: 'GEMI Portal',
      apiEndpoint: null, // No public API
      registrationNumberLabel: 'GEMI Number (Αριθμός Γ.Ε.ΜΗ.)',
      registrationNumberFormat: /^\d{12}$/,
      registrationNumberExample: '123456789012',
      alternativeLabel: 'Tax Registration Number (ΑΦΜ)',
      alternativeFormat: /^\d{9}$/,
      notes: 'GEMI portal offers free search. No API — use OpenCorporates or web scraping.'
    },

    vatValidation: {
      prefix: 'EL',  // Note: Greece uses EL prefix, not GR
      format: /^EL\d{9}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
    },

    requiredDocuments: [
      'pistopoiitiko_gemi',       // GEMI certificate
      'bebaiosi_enarxis',         // Tax office registration certificate
    ],
  },

  // ================================================================
  // HUNGARY (HU)
  // ================================================================
  HU: {
    country: 'Hungary',
    localName: 'Magyarország',
    officialLanguages: ['hu'],
    digitalConsentAge: 16,
    flag: '🇭🇺',

    businessRegister: {
      name: 'Company Registry (Céginformációs Szolgálat)',
      authority: 'Ministry of Justice',
      website: 'https://www.e-cegjegyzek.hu/',
      apiProvider: 'e-Cégjegyzék',
      apiEndpoint: null, // No free API
      registrationNumberLabel: 'Cégjegyzékszám (Company Registration Number)',
      registrationNumberFormat: /^\d{2}-\d{2}-\d{6}$/,
      registrationNumberExample: '01-09-123456',
      notes: 'Free search on e-cegjegyzek.hu. No API. Use OpenCorporates.'
    },

    vatValidation: {
      prefix: 'HU',
      format: /^HU\d{8}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
    },

    requiredDocuments: [
      'cegjegyzek_kivonat',       // Company register extract
    ],
  },

  // ================================================================
  // IRELAND (IE)
  // ================================================================
  IE: {
    country: 'Ireland',
    localName: 'Éire',
    officialLanguages: ['en', 'ga'],
    digitalConsentAge: 16,
    flag: '🇮🇪',

    businessRegister: {
      name: 'Companies Registration Office (CRO)',
      authority: 'Department of Enterprise, Trade and Employment',
      website: 'https://core.cro.ie/',
      apiProvider: 'CRO CORE Search',
      apiEndpoint: 'https://services.cro.ie/cws/companies?comp_id={company_number}',
      apiDocs: 'https://services.cro.ie/',
      registrationNumberLabel: 'CRO Number',
      registrationNumberFormat: /^\d{1,6}$/,
      registrationNumberExample: '123456',
      notes: 'CRO has a web services API. Free for basic company information. Ireland is a major GDPR hub (many tech companies register here).'
    },

    vatValidation: {
      prefix: 'IE',
      format: /^IE\d{7}[A-Z]{1,2}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'Eircode (Irish postcode system)',
    },

    requiredDocuments: [
      'certificate_of_incorporation',
      'annual_return',
    ],
  },

  // ================================================================
  // ITALY (IT)
  // ================================================================
  IT: {
    country: 'Italy',
    localName: 'Italia',
    officialLanguages: ['it'],
    digitalConsentAge: 14,
    flag: '🇮🇹',

    businessRegister: {
      name: 'Business Register (Registro Imprese)',
      authority: 'InfoCamere / Chambers of Commerce',
      website: 'https://www.registroimprese.it/',
      apiProvider: 'InfoCamere',
      apiEndpoint: 'https://api.infocamere.it/', // Requires registration
      openDataEndpoint: 'https://dati.mise.gov.it/',
      registrationNumberLabel: 'Codice Fiscale / Partita IVA / REA Number',
      registrationNumberFormat: /^(\d{11}|[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])$/,
      registrationNumberExample: '12345678901',
      notes: 'InfoCamere API requires paid registration. Free search on registroimprese.it. Italian companies have multiple numbers: Codice Fiscale, Partita IVA, and REA.'
    },

    vatValidation: {
      prefix: 'IT',
      format: /^IT\d{11}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
    },

    requiredDocuments: [
      'visura_camerale',           // Chamber of Commerce extract
      'certificato_iscrizione',    // Registration certificate
    ],
  },

  // ================================================================
  // LATVIA (LV)
  // ================================================================
  LV: {
    country: 'Latvia',
    localName: 'Latvija',
    officialLanguages: ['lv'],
    digitalConsentAge: 13,
    flag: '🇱🇻',

    businessRegister: {
      name: 'Register of Enterprises (Uzņēmumu reģistrs)',
      authority: 'Register of Enterprises of the Republic of Latvia',
      website: 'https://www.ur.gov.lv/en/',
      apiProvider: 'UR Portal',
      apiEndpoint: 'https://info.ur.gov.lv/api/', // Limited public API
      registrationNumberLabel: 'Registration Number (Reģistrācijas numurs)',
      registrationNumberFormat: /^\d{11}$/,
      registrationNumberExample: '40003012345',
      notes: 'Basic search available for free. Full extracts are paid. Use OpenCorporates as fallback.'
    },

    vatValidation: { prefix: 'LV', format: /^LV\d{11}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['izraksts_no_komercregistra'],
  },

  // ================================================================
  // LITHUANIA (LT)
  // ================================================================
  LT: {
    country: 'Lithuania',
    localName: 'Lietuva',
    officialLanguages: ['lt'],
    digitalConsentAge: 14,
    flag: '🇱🇹',

    businessRegister: {
      name: 'Register of Legal Entities (Juridinių asmenų registras)',
      authority: 'State Enterprise Centre of Registers',
      website: 'https://www.registrucentras.lt/jar/p/',
      apiProvider: 'Registrų Centras',
      apiEndpoint: 'https://www.registrucentras.lt/jar/p/api/',
      registrationNumberLabel: 'Company Code (Įmonės kodas)',
      registrationNumberFormat: /^\d{7,9}$/,
      registrationNumberExample: '123456789',
      notes: 'Basic free search available. API requires registration.'
    },

    vatValidation: { prefix: 'LT', format: /^LT(\d{9}|\d{12})$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['israsas_is_juridniu_asmenu_registro'],
  },

  // ================================================================
  // LUXEMBOURG (LU)
  // ================================================================
  LU: {
    country: 'Luxembourg',
    localName: 'Luxembourg',
    officialLanguages: ['fr', 'de', 'lb'],
    digitalConsentAge: 16,
    flag: '🇱🇺',

    businessRegister: {
      name: 'Luxembourg Business Registers (LBR / RCS)',
      authority: 'Ministry of Justice',
      website: 'https://www.lbr.lu/',
      apiProvider: 'LBR Portal',
      apiEndpoint: 'https://www.lbr.lu/mjrcs/jsp/webapp/static/mjrcs/en/mjrcs/search.html',
      registrationNumberLabel: 'RCS Number (Numéro RCS)',
      registrationNumberFormat: /^B\d{1,6}$/i,
      registrationNumberExample: 'B 123456',
      notes: 'Search available on LBR portal. No public API. Use OpenCorporates.'
    },

    vatValidation: { prefix: 'LU', format: /^LU\d{8}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['extrait_rcs'],
  },

  // ================================================================
  // MALTA (MT)
  // ================================================================
  MT: {
    country: 'Malta',
    localName: 'Malta',
    officialLanguages: ['mt', 'en'],
    digitalConsentAge: 13,
    flag: '🇲🇹',

    businessRegister: {
      name: 'Malta Business Registry (MBR)',
      authority: 'Malta Financial Services Authority',
      website: 'https://registry.mbr.mt/ROC/index.jsp',
      apiProvider: 'MBR Online',
      apiEndpoint: null,
      registrationNumberLabel: 'Registration Number',
      registrationNumberFormat: /^C\s?\d{1,6}$/i,
      registrationNumberExample: 'C 12345',
      notes: 'Free search on MBR portal. No API.'
    },

    vatValidation: { prefix: 'MT', format: /^MT\d{8}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['certificate_of_registration', 'memorandum_of_association'],
  },

  // ================================================================
  // NETHERLANDS (NL)
  // ================================================================
  NL: {
    country: 'Netherlands',
    localName: 'Nederland',
    officialLanguages: ['nl'],
    digitalConsentAge: 16,
    flag: '🇳🇱',

    businessRegister: {
      name: 'KVK (Kamer van Koophandel / Chamber of Commerce)',
      authority: 'Netherlands Chamber of Commerce',
      website: 'https://www.kvk.nl/',
      apiProvider: 'KVK API',
      apiEndpoint: 'https://api.kvk.nl/api/v1/zoeken?kvkNummer={kvk_number}',
      apiDocs: 'https://developers.kvk.nl/',
      registrationNumberLabel: 'KVK Number (KVK-nummer)',
      registrationNumberFormat: /^\d{8}$/,
      registrationNumberExample: '12345678',
      notes: 'KVK has a well-documented REST API. Requires API key (free for basic, paid for full). Primary provider for NL.'
    },

    vatValidation: {
      prefix: 'NL',
      format: /^NL\d{9}B\d{2}$/,
      method: 'vies',
    },

    addressValidation: {
      provider: 'google_places',
      alternativeProvider: 'BAG (Basisregistratie Adressen en Gebouwen) — free Dutch address register API',
    },

    requiredDocuments: [
      'kvk_uittreksel',           // KVK extract
    ],
  },

  // ================================================================
  // POLAND (PL)
  // ================================================================
  PL: {
    country: 'Poland',
    localName: 'Polska',
    officialLanguages: ['pl'],
    digitalConsentAge: 16,
    flag: '🇵🇱',

    businessRegister: {
      name: 'National Court Register (KRS — Krajowy Rejestr Sądowy)',
      authority: 'Ministry of Justice',
      website: 'https://ekrs.ms.gov.pl/web/wyszukiwarka-krs',
      apiProvider: 'KRS API',
      apiEndpoint: 'https://api-krs.ms.gov.pl/api/krs/OdpisPelny/{krs_number}',
      apiDocs: 'https://api-krs.ms.gov.pl/',
      alternativeApi: 'https://wl-api.mf.gov.pl/api/search/nip/{nip}', // White List API (tax)
      registrationNumberLabel: 'KRS Number / NIP / REGON',
      registrationNumberFormat: /^(\d{10}|\d{9}|\d{14})$/, // KRS=10, NIP=10, REGON=9 or 14
      registrationNumberExample: 'KRS: 0000123456 / NIP: 1234567890',
      notes: 'FREE KRS API available. White List API for NIP verification is also free. Excellent data quality.'
    },

    vatValidation: { prefix: 'PL', format: /^PL\d{10}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['odpis_krs'],
  },

  // ================================================================
  // PORTUGAL (PT)
  // ================================================================
  PT: {
    country: 'Portugal',
    localName: 'Portugal',
    officialLanguages: ['pt'],
    digitalConsentAge: 13,
    flag: '🇵🇹',

    businessRegister: {
      name: 'Commercial Registry (Registo Comercial)',
      authority: 'Institute of Registries and Notaries (IRN)',
      website: 'https://publicacoes.mj.pt/Pesquisa.aspx',
      apiProvider: 'IRN Portal',
      apiEndpoint: null,
      registrationNumberLabel: 'NIPC (Número de Identificação de Pessoa Coletiva)',
      registrationNumberFormat: /^\d{9}$/,
      registrationNumberExample: '123456789',
      notes: 'No public API. Search available on publications portal. Use OpenCorporates.'
    },

    vatValidation: { prefix: 'PT', format: /^PT\d{9}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['certidao_permanente'],
  },

  // ================================================================
  // ROMANIA (RO)
  // ================================================================
  RO: {
    country: 'Romania',
    localName: 'România',
    officialLanguages: ['ro'],
    digitalConsentAge: 16,
    flag: '🇷🇴',

    businessRegister: {
      name: 'National Trade Register Office (ONRC)',
      authority: 'Ministry of Justice',
      website: 'https://www.onrc.ro/index.php/en/',
      apiProvider: 'ONRC Portal / ListaFirme.ro',
      apiEndpoint: 'https://api.openapi.ro/api/companies/{cui}', // Third-party API
      registrationNumberLabel: 'CUI (Cod Unic de Înregistrare)',
      registrationNumberFormat: /^(RO)?\d{2,10}$/,
      registrationNumberExample: '12345678',
      notes: 'ONRC has an official portal but limited API. ListaFirme.ro and OpenAPI.ro offer third-party APIs.'
    },

    vatValidation: { prefix: 'RO', format: /^RO\d{2,10}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['certificat_constatator'],
  },

  // ================================================================
  // SLOVAKIA (SK)
  // ================================================================
  SK: {
    country: 'Slovakia',
    localName: 'Slovensko',
    officialLanguages: ['sk'],
    digitalConsentAge: 16,
    flag: '🇸🇰',

    businessRegister: {
      name: 'Commercial Register (Obchodný register)',
      authority: 'Ministry of Justice',
      website: 'https://www.orsr.sk/',
      apiProvider: 'ORSR Portal',
      apiEndpoint: 'https://rpo.statistics.sk/rpo/json/{ico}', // RPO Statistics API
      registrationNumberLabel: 'IČO (Identifikačné číslo organizácie)',
      registrationNumberFormat: /^\d{8}$/,
      registrationNumberExample: '12345678',
      notes: 'RPO (Register of Legal Entities) has a JSON API. Free. Also FinStat.sk for enriched data.'
    },

    vatValidation: { prefix: 'SK', format: /^SK\d{10}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['vypis_z_obchodneho_registra'],
  },

  // ================================================================
  // SLOVENIA (SI)
  // ================================================================
  SI: {
    country: 'Slovenia',
    localName: 'Slovenija',
    officialLanguages: ['sl'],
    digitalConsentAge: 15,
    flag: '🇸🇮',

    businessRegister: {
      name: 'AJPES (Agency for Public Legal Records and Related Services)',
      authority: 'AJPES',
      website: 'https://www.ajpes.si/prs/',
      apiProvider: 'AJPES API',
      apiEndpoint: 'https://www.ajpes.si/api/',
      registrationNumberLabel: 'Matična številka (Registration Number)',
      registrationNumberFormat: /^\d{7,10}$/,
      registrationNumberExample: '1234567000',
      notes: 'AJPES has a public search and API. Free for basic data.'
    },

    vatValidation: { prefix: 'SI', format: /^SI\d{8}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['izpis_iz_poslovnega_registra'],
  },

  // ================================================================
  // SPAIN (ES)
  // ================================================================
  ES: {
    country: 'Spain',
    localName: 'España',
    officialLanguages: ['es'],  // + regional: ca, eu, gl
    digitalConsentAge: 14,
    flag: '🇪🇸',

    businessRegister: {
      name: 'Registro Mercantil (Commercial Register)',
      authority: 'Ministry of Justice',
      website: 'https://www.registradores.org/',
      apiProvider: 'Registradores.org',
      apiEndpoint: null, // No public API — paid service
      alternativeApi: 'https://www.infocif.es/', // Third-party
      registrationNumberLabel: 'CIF / NIF (Código de Identificación Fiscal)',
      registrationNumberFormat: /^[A-Z]\d{7}[A-Z0-9]$/,
      registrationNumberExample: 'B12345678',
      notes: 'No free API. Registradores.org offers paid lookups. Libreborme.net is a community project with some open data. Use OpenCorporates.'
    },

    vatValidation: { prefix: 'ES', format: /^ES[A-Z]\d{7}[A-Z0-9]$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['nota_simple', 'certificado_de_denominacion_social'],
  },

  // ================================================================
  // SWEDEN (SE)
  // ================================================================
  SE: {
    country: 'Sweden',
    localName: 'Sverige',
    officialLanguages: ['sv'],
    digitalConsentAge: 13,
    flag: '🇸🇪',

    businessRegister: {
      name: 'Bolagsverket (Swedish Companies Registration Office)',
      authority: 'Bolagsverket',
      website: 'https://www.bolagsverket.se/',
      apiProvider: 'Bolagsverket / Allabolag.se',
      apiEndpoint: 'https://www.allabolag.se/api/', // Third-party aggregator
      registrationNumberLabel: 'Organisationsnummer',
      registrationNumberFormat: /^\d{6}-?\d{4}$/,
      registrationNumberExample: '556123-4567',
      notes: 'Bolagsverket has no free public API. Allabolag.se offers a third-party API. Use OpenCorporates as fallback.'
    },

    vatValidation: { prefix: 'SE', format: /^SE\d{12}$/, method: 'vies' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['registreringsbevis'],
  },

  // ================================================================
  // EEA NON-EU MEMBERS
  // ================================================================

  // NORWAY (NO) — EEA
  NO: {
    country: 'Norway',
    localName: 'Norge',
    officialLanguages: ['nb', 'nn'],
    digitalConsentAge: 13,
    flag: '🇳🇴',
    isEuMember: false,
    isEeaMember: true,

    businessRegister: {
      name: 'Brønnøysund Register Centre (Brønnøysundregistrene)',
      authority: 'Brønnøysund Register Centre',
      website: 'https://www.brreg.no/',
      apiProvider: 'Brønnøysund API',
      apiEndpoint: 'https://data.brreg.no/enhetsregisteret/api/enheter/{org_number}',
      apiDocs: 'https://data.brreg.no/enhetsregisteret/api/docs/index.html',
      registrationNumberLabel: 'Organisasjonsnummer',
      registrationNumberFormat: /^\d{9}$/,
      registrationNumberExample: '123456789',
      notes: 'EXCELLENT free public REST API. One of the best in Europe. Primary provider for NO.'
    },

    vatValidation: {
      prefix: 'NO',
      format: /^NO\d{9}MVA$/,
      method: 'manual', // Norway not in VIES (not EU). Validate via Brønnøysund.
    },

    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['firmaattest'],
  },

  // ICELAND (IS) — EEA
  IS: {
    country: 'Iceland',
    localName: 'Ísland',
    officialLanguages: ['is'],
    digitalConsentAge: 13,
    flag: '🇮🇸',
    isEuMember: false,
    isEeaMember: true,

    businessRegister: {
      name: 'Registers Iceland (Ríkisskattstjóri)',
      authority: 'Directorate of Internal Revenue',
      website: 'https://www.skatturinn.is/fyrirtaekjaskra/',
      apiProvider: 'Skatturinn Company Registry',
      apiEndpoint: null,
      registrationNumberLabel: 'Kennitala',
      registrationNumberFormat: /^\d{6}-?\d{4}$/,
      registrationNumberExample: '123456-7890',
      notes: 'Free search on skatturinn.is. No API. Use OpenCorporates.'
    },

    vatValidation: { prefix: 'IS', format: /^\d{5,6}$/, method: 'manual' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['fyrirtaekjaskra_utskrift'],
  },

  // LIECHTENSTEIN (LI) — EEA
  LI: {
    country: 'Liechtenstein',
    localName: 'Liechtenstein',
    officialLanguages: ['de'],
    digitalConsentAge: 16,
    flag: '🇱🇮',
    isEuMember: false,
    isEeaMember: true,

    businessRegister: {
      name: 'Commercial Register (Handelsregister)',
      authority: 'Office of Justice',
      website: 'https://www.oera.li/',
      apiProvider: 'ÖERA Portal',
      apiEndpoint: null,
      registrationNumberLabel: 'FL-Number',
      registrationNumberFormat: /^FL-\d{4}\.\d{3}\.\d{3}-\d$/,
      registrationNumberExample: 'FL-0001.234.567-8',
      notes: 'Free search on oera.li. No API. Very small country — manual verification feasible.'
    },

    vatValidation: { prefix: null, format: null, method: 'manual' },
    addressValidation: { provider: 'google_places' },
    requiredDocuments: ['handelsregisterauszug'],
  },
};

// ================================================================
// CROSS-BORDER VERIFICATION SERVICES (Fallback for all countries)
// ================================================================
export const CROSS_BORDER_PROVIDERS = {
  openCorporates: {
    name: 'OpenCorporates',
    website: 'https://opencorporates.com',
    apiEndpoint: 'https://api.opencorporates.com/v0.4/',
    apiDocs: 'https://api.opencorporates.com/',
    coverage: 'Global — 200M+ companies from 140+ jurisdictions',
    pricing: 'Free tier (limited), paid plans for full API access',
    useCase: 'Primary fallback for countries without free national APIs',
  },

  orbis: {
    name: 'Bureau van Dijk — Orbis',
    website: 'https://orbis.bvdinfo.com/',
    coverage: 'Global — 400M+ companies',
    pricing: 'Enterprise — contact for pricing',
    useCase: 'Enterprise tier clients. Most comprehensive global data.',
  },

  europeanBusinessRegister: {
    name: 'European Business Register (EBR)',
    website: 'https://ebr.org/',
    coverage: 'EU/EEA member states',
    pricing: 'Per-query pricing',
    useCase: 'Official cross-border register network. Useful for legal verification.',
  },

  bvd: {
    name: 'Dun & Bradstreet',
    website: 'https://www.dnb.com/',
    coverage: 'Global — DUNS numbers',
    pricing: 'Enterprise',
    useCase: 'Enterprise tier. DUNS number verification. Credit reports.',
  },

  viesVat: {
    name: 'VIES (VAT Information Exchange System)',
    website: 'https://ec.europa.eu/taxation_customs/vies/',
    apiEndpoint: 'SOAP: https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl',
    restEndpoint: 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number',
    coverage: 'All EU member states',
    pricing: 'Free',
    useCase: 'VAT validation for all EU countries. Always use for VAT checks.',
  },
};
```

---

## EU Country Legal Framework — DPAs & National GDPR Implementation

### Complete DPA Authority Registry

```typescript
// packages/shared/src/constants/dpa-authorities.ts

export const DPA_AUTHORITIES: Record<string, DpaAuthorityEntry> = {

  AT: {
    name: 'Österreichische Datenschutzbehörde (DSB)',
    nameEnglish: 'Austrian Data Protection Authority',
    abbreviation: 'DSB',
    website: 'https://www.dsb.gv.at/',
    complaintUrl: 'https://www.dsb.gv.at/download-links/formulare.html',
    breachNotificationUrl: 'https://www.dsb.gv.at/download-links/formulare.html',
    breachNotificationMethod: 'online_form',
    contactEmail: 'dsb@dsb.gv.at',
    contactPhone: '+43 1 52 152-0',
    address: { street: 'Barichgasse 40-42', city: 'Wien', postalCode: '1030', country: 'AT' },
    nationalLaw: 'Datenschutzgesetz (DSG)',
    nationalLawUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001597',
    guidanceLanguage: 'de',
    breachFormLanguage: 'de',
  },

  BE: {
    name: 'Autorité de protection des données / Gegevensbeschermingsautoriteit (APD/GBA)',
    nameEnglish: 'Belgian Data Protection Authority',
    abbreviation: 'APD/GBA',
    website: 'https://www.autoriteprotectiondonnees.be/',
    complaintUrl: 'https://www.autoriteprotectiondonnees.be/citoyen/agir/introduire-une-plainte',
    breachNotificationUrl: 'https://www.autoriteprotectiondonnees.be/professionnel/actions/fuites-de-donnees-notification-a-lapd',
    breachNotificationMethod: 'online_portal',
    contactEmail: 'contact@apd-gba.be',
    contactPhone: '+32 2 274 48 00',
    address: { street: 'Rue de la Presse 35', city: 'Bruxelles', postalCode: '1000', country: 'BE' },
    nationalLaw: 'Loi du 30 juillet 2018 relative à la protection des personnes physiques à l\'égard des traitements de données à caractère personnel',
    guidanceLanguage: 'fr,nl,de',
    breachFormLanguage: 'fr,nl',
  },

  BG: {
    name: 'Комисия за защита на личните данни (КЗЛД)',
    nameEnglish: 'Commission for Personal Data Protection',
    abbreviation: 'CPDP',
    website: 'https://www.cpdp.bg/',
    breachNotificationUrl: 'https://www.cpdp.bg/en/index.php?p=pages&aid=6',
    breachNotificationMethod: 'email',
    contactEmail: 'kzld@cpdp.bg',
    contactPhone: '+359 2 915 35 18',
    address: { street: 'Prof. Tsvetan Lazarov Blvd. 2', city: 'Sofia', postalCode: '1592', country: 'BG' },
    nationalLaw: 'Law on Protection of Personal Data (LPPD)',
    guidanceLanguage: 'bg',
    breachFormLanguage: 'bg',
  },

  HR: {
    name: 'Agencija za zaštitu osobnih podataka (AZOP)',
    nameEnglish: 'Croatian Personal Data Protection Agency',
    abbreviation: 'AZOP',
    website: 'https://azop.hr/',
    breachNotificationUrl: 'https://azop.hr/obrasci/',
    breachNotificationMethod: 'online_form',
    contactEmail: 'azop@azop.hr',
    contactPhone: '+385 1 4609 000',
    address: { street: 'Fra Grge Martića 14', city: 'Zagreb', postalCode: '10000', country: 'HR' },
    nationalLaw: 'Zakon o provedbi Opće uredbe o zaštiti podataka (Implementation Act)',
    guidanceLanguage: 'hr',
    breachFormLanguage: 'hr',
  },

  CY: {
    name: 'Γραφείο Επιτρόπου Δεδομένων Προσωπικού Χαρακτήρα',
    nameEnglish: 'Commissioner for Personal Data Protection',
    abbreviation: 'CPDP',
    website: 'http://www.dataprotection.gov.cy/',
    contactEmail: 'commissioner@dataprotection.gov.cy',
    contactPhone: '+357 22 818 456',
    address: { street: 'Iasonos 1, 2nd floor', city: 'Nicosia', postalCode: '1082', country: 'CY' },
    nationalLaw: 'Law 125(I)/2018',
    guidanceLanguage: 'el',
    breachFormLanguage: 'el,en',
  },

  CZ: {
    name: 'Úřad pro ochranu osobních údajů (ÚOOÚ)',
    nameEnglish: 'Office for Personal Data Protection',
    abbreviation: 'ÚOOÚ',
    website: 'https://www.uoou.cz/',
    breachNotificationUrl: 'https://www.uoou.cz/en/vismo/dokumenty2.asp?id_org=200156&id=1715',
    contactEmail: 'posta@uoou.cz',
    contactPhone: '+420 234 665 111',
    address: { street: 'Pplk. Sochora 27', city: 'Praha 7', postalCode: '170 00', country: 'CZ' },
    nationalLaw: 'Act No. 110/2019 Coll. on Personal Data Processing',
    guidanceLanguage: 'cs',
    breachFormLanguage: 'cs',
  },

  DK: {
    name: 'Datatilsynet',
    nameEnglish: 'Danish Data Protection Agency',
    abbreviation: 'Datatilsynet',
    website: 'https://www.datatilsynet.dk/',
    breachNotificationUrl: 'https://indberet.virk.dk/myndigheder/stat/telefonboegen/telefonbog_telefonbog/datatilsynet/anmeld_brud',
    breachNotificationMethod: 'online_portal_virk',
    contactEmail: 'dt@datatilsynet.dk',
    contactPhone: '+45 33 19 32 00',
    address: { street: 'Carl Jacobsens Vej 35', city: 'Valby', postalCode: '2500', country: 'DK' },
    nationalLaw: 'Danish Data Protection Act (Act No. 502 of 23 May 2018)',
    guidanceLanguage: 'da',
    breachFormLanguage: 'da',
  },

  EE: {
    name: 'Andmekaitse Inspektsioon (AKI)',
    nameEnglish: 'Estonian Data Protection Inspectorate',
    abbreviation: 'AKI',
    website: 'https://www.aki.ee/',
    breachNotificationUrl: 'https://www.aki.ee/en/data-protection-reform/reporting-personal-data-breach',
    contactEmail: 'info@aki.ee',
    contactPhone: '+372 627 4135',
    address: { street: 'Tatari 39', city: 'Tallinn', postalCode: '10134', country: 'EE' },
    nationalLaw: 'Personal Data Protection Act (IKS — Isikuandmete kaitse seadus)',
    guidanceLanguage: 'et',
    breachFormLanguage: 'et,en',
  },

  FI: {
    name: 'Tietosuojavaltuutetun toimisto',
    nameEnglish: 'Office of the Data Protection Ombudsman',
    abbreviation: 'TSV',
    website: 'https://tietosuoja.fi/en/',
    breachNotificationUrl: 'https://tietosuoja.fi/en/notification-of-a-personal-data-breach',
    breachNotificationMethod: 'online_form',
    contactEmail: 'tietosuoja@om.fi',
    contactPhone: '+358 29 566 6700',
    address: { street: 'Lintulahdenkuja 4', city: 'Helsinki', postalCode: '00530', country: 'FI' },
    nationalLaw: 'Data Protection Act (Tietosuojalaki 1050/2018)',
    guidanceLanguage: 'fi,sv',
    breachFormLanguage: 'fi,sv,en',
  },

  FR: {
    name: 'Commission Nationale de l\'Informatique et des Libertés (CNIL)',
    nameEnglish: 'French Data Protection Authority',
    abbreviation: 'CNIL',
    website: 'https://www.cnil.fr/',
    complaintUrl: 'https://www.cnil.fr/fr/plaintes',
    breachNotificationUrl: 'https://notifications.cnil.fr/notifications/index',
    breachNotificationMethod: 'online_portal',
    contactEmail: null, // CNIL uses online forms only
    contactPhone: '+33 1 53 73 22 22',
    address: { street: '3 Place de Fontenoy', city: 'Paris', postalCode: '75007', country: 'FR' },
    nationalLaw: 'Loi n° 78-17 du 6 janvier 1978 relative à l\'informatique, aux fichiers et aux libertés (as amended)',
    nationalLawUrl: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460',
    guidanceLanguage: 'fr',
    breachFormLanguage: 'fr',
    notes: 'CNIL is one of the most active DPAs in Europe. Extensive guidance available.',
  },

  DE: {
    name: 'Der Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)',
    nameEnglish: 'Federal Commissioner for Data Protection and Freedom of Information',
    abbreviation: 'BfDI',
    website: 'https://www.bfdi.bund.de/',
    breachNotificationUrl: 'https://www.bfdi.bund.de/DE/Buerger/Inhalte/Allgemein/Datenpanne/Datenpanne_Meldung.html',
    contactEmail: 'poststelle@bfdi.bund.de',
    contactPhone: '+49 228 997799-0',
    address: { street: 'Graurheindorfer Str. 153', city: 'Bonn', postalCode: '53117', country: 'DE' },
    nationalLaw: 'Bundesdatenschutzgesetz (BDSG)',
    nationalLawUrl: 'https://www.gesetze-im-internet.de/bdsg_2018/',
    guidanceLanguage: 'de',
    breachFormLanguage: 'de',

    // GERMANY-SPECIFIC: 16 state-level DPAs (Landesdatenschutzbeauftragte)
    stateDpas: {
      'DE-BW': { name: 'LfDI Baden-Württemberg', website: 'https://www.baden-wuerttemberg.datenschutz.de/' },
      'DE-BY': { name: 'BayLDA', website: 'https://www.lda.bayern.de/' },
      'DE-BE': { name: 'BlnBDI', website: 'https://www.datenschutz-berlin.de/' },
      'DE-BB': { name: 'LDA Brandenburg', website: 'https://www.lda.brandenburg.de/' },
      'DE-HB': { name: 'LfDI Bremen', website: 'https://www.datenschutz.bremen.de/' },
      'DE-HH': { name: 'HmbBfDI', website: 'https://datenschutz-hamburg.de/' },
      'DE-HE': { name: 'HBDI', website: 'https://datenschutz.hessen.de/' },
      'DE-MV': { name: 'LfDI M-V', website: 'https://www.datenschutz-mv.de/' },
      'DE-NI': { name: 'LfD Niedersachsen', website: 'https://www.lfd.niedersachsen.de/' },
      'DE-NW': { name: 'LDI NRW', website: 'https://www.ldi.nrw.de/' },
      'DE-RP': { name: 'LfDI Rheinland-Pfalz', website: 'https://www.datenschutz.rlp.de/' },
      'DE-SL': { name: 'LfDI Saarland', website: 'https://www.datenschutz.saarland.de/' },
      'DE-SN': { name: 'SächsDSB', website: 'https://www.saechsdsb.de/' },
      'DE-ST': { name: 'LfD Sachsen-Anhalt', website: 'https://datenschutz.sachsen-anhalt.de/' },
      'DE-SH': { name: 'ULD', website: 'https://www.datenschutzzentrum.de/' },
      'DE-TH': { name: 'TLfDI', website: 'https://www.tlfdi.de/' },
    },
    notes: 'Germany has BOTH a federal DPA (BfDI — for federal public bodies and telecoms) AND 16 state-level DPAs for the private sector. The applicable DPA depends on the company\'s registered state (Bundesland). The platform MUST ask for the Bundesland during onboarding to route to the correct DPA.',
  },

  GR: {
    name: 'Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (ΑΠΔΠΧ)',
    nameEnglish: 'Hellenic Data Protection Authority',
    abbreviation: 'HDPA',
    website: 'https://www.dpa.gr/',
    breachNotificationUrl: 'https://www.dpa.gr/en/individuals/personal-data-breach',
    contactEmail: 'contact@dpa.gr',
    contactPhone: '+30 210 647 5600',
    address: { street: 'Kifissias 1-3', city: 'Athens', postalCode: '115 23', country: 'GR' },
    nationalLaw: 'Law 4624/2019',
    guidanceLanguage: 'el',
    breachFormLanguage: 'el',
  },

  HU: {
    name: 'Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)',
    nameEnglish: 'Hungarian National Authority for Data Protection and Freedom of Information',
    abbreviation: 'NAIH',
    website: 'https://www.naih.hu/',
    breachNotificationUrl: 'https://www.naih.hu/adatvedelmi-incidens-bejelentes',
    contactEmail: 'ugyfelszolgalat@naih.hu',
    contactPhone: '+36 1 391 1400',
    address: { street: 'Falk Miksa utca 9-11', city: 'Budapest', postalCode: '1055', country: 'HU' },
    nationalLaw: 'Act CXII of 2011 on Informational Self-Determination and Freedom of Information',
    guidanceLanguage: 'hu',
    breachFormLanguage: 'hu',
  },

  IE: {
    name: 'An Coimisiún um Chosaint Sonraí / Data Protection Commission (DPC)',
    nameEnglish: 'Data Protection Commission',
    abbreviation: 'DPC',
    website: 'https://www.dataprotection.ie/',
    complaintUrl: 'https://forms.dataprotection.ie/contact',
    breachNotificationUrl: 'https://www.dataprotection.ie/en/organisations/know-your-obligations/breach-notification',
    breachNotificationMethod: 'online_portal',
    contactEmail: 'info@dataprotection.ie',
    contactPhone: '+353 57 868 4800',
    address: { street: '21 Fitzwilliam Square South', city: 'Dublin 2', postalCode: 'D02 RD28', country: 'IE' },
    nationalLaw: 'Data Protection Act 2018',
    guidanceLanguage: 'en',
    breachFormLanguage: 'en',
    notes: 'DPC is the lead supervisory authority for many big tech companies (Google, Meta, Apple, Microsoft, etc.) due to their EU HQ being in Ireland.',
  },

  IT: {
    name: 'Garante per la protezione dei dati personali',
    nameEnglish: 'Italian Data Protection Authority',
    abbreviation: 'Garante',
    website: 'https://www.garanteprivacy.it/',
    breachNotificationUrl: 'https://servizi.gpdp.it/databreach/s/',
    breachNotificationMethod: 'online_portal',
    contactEmail: 'garante@gpdp.it',
    contactPhone: '+39 06 696 771',
    address: { street: 'Piazza Venezia, 11', city: 'Roma', postalCode: '00187', country: 'IT' },
    nationalLaw: 'Decreto Legislativo 30 giugno 2003, n. 196 (as amended by D.Lgs. 101/2018)',
    guidanceLanguage: 'it',
    breachFormLanguage: 'it',
  },

  LV: {
    name: 'Datu valsts inspekcija (DVI)',
    nameEnglish: 'Data State Inspectorate',
    abbreviation: 'DVI',
    website: 'https://www.dvi.gov.lv/',
    contactEmail: 'info@dvi.gov.lv',
    contactPhone: '+371 67 22 31 31',
    address: { street: 'Elijas iela 17', city: 'Rīga', postalCode: 'LV-1050', country: 'LV' },
    nationalLaw: 'Personal Data Processing Law (2018)',
    guidanceLanguage: 'lv',
    breachFormLanguage: 'lv',
  },

  LT: {
    name: 'Valstybinė duomenų apsaugos inspekcija (VDAI)',
    nameEnglish: 'State Data Protection Inspectorate',
    abbreviation: 'VDAI',
    website: 'https://vdai.lrv.lt/',
    contactEmail: 'ada@ada.lt',
    contactPhone: '+370 5 279 1445',
    address: { street: 'L. Sapiegos g. 17', city: 'Vilnius', postalCode: '10312', country: 'LT' },
    nationalLaw: 'Law on Legal Protection of Personal Data (2018 amendment)',
    guidanceLanguage: 'lt',
    breachFormLanguage: 'lt',
  },

  LU: {
    name: 'Commission Nationale pour la Protection des Données (CNPD)',
    nameEnglish: 'National Commission for Data Protection',
    abbreviation: 'CNPD',
    website: 'https://cnpd.public.lu/',
    breachNotificationUrl: 'https://cnpd.public.lu/en/professionnels/notifier-une-violation.html',
    breachNotificationMethod: 'online_form',
    contactEmail: 'info@cnpd.lu',
    contactPhone: '+352 26 10 60-1',
    address: { street: '15, Boulevard du Jazz', city: 'Belvaux', postalCode: 'L-4370', country: 'LU' },
    nationalLaw: 'Loi du 1er août 2018 portant organisation de la CNPD',
    guidanceLanguage: 'fr',
    breachFormLanguage: 'fr',
  },

  MT: {
    name: 'Office of the Information and Data Protection Commissioner (IDPC)',
    nameEnglish: 'Information and Data Protection Commissioner',
    abbreviation: 'IDPC',
    website: 'https://idpc.org.mt/',
    breachNotificationUrl: 'https://idpc.org.mt/personal-data-breach/',
    contactEmail: 'idpc.info@idpc.org.mt',
    contactPhone: '+356 2328 7100',
    address: { street: 'Floor 2, Airways House', city: 'Floriana', postalCode: 'FRN 9401', country: 'MT' },
    nationalLaw: 'Data Protection Act (Cap. 586)',
    guidanceLanguage: 'en,mt',
    breachFormLanguage: 'en',
  },

  NL: {
    name: 'Autoriteit Persoonsgegevens (AP)',
    nameEnglish: 'Dutch Data Protection Authority',
    abbreviation: 'AP',
    website: 'https://autoriteitpersoonsgegevens.nl/',
    breachNotificationUrl: 'https://datalekken.autoriteitpersoonsgegevens.nl/',
    breachNotificationMethod: 'online_portal',
    contactEmail: null, // Uses online forms
    contactPhone: '+31 88 180 5250',
    address: { street: 'Bezuidenhoutseweg 30', city: 'Den Haag', postalCode: '2594 AV', country: 'NL' },
    nationalLaw: 'Uitvoeringswet AVG (UAVG)',
    guidanceLanguage: 'nl',
    breachFormLanguage: 'nl',
  },

  PL: {
    name: 'Urząd Ochrony Danych Osobowych (UODO)',
    nameEnglish: 'Personal Data Protection Office',
    abbreviation: 'UODO',
    website: 'https://uodo.gov.pl/',
    breachNotificationUrl: 'https://uodo.gov.pl/en/553',
    contactEmail: 'kancelaria@uodo.gov.pl',
    contactPhone: '+48 22 531 03 00',
    address: { street: 'ul. Stawki 2', city: 'Warszawa', postalCode: '00-193', country: 'PL' },
    nationalLaw: 'Act of 10 May 2018 on the Protection of Personal Data',
    guidanceLanguage: 'pl',
    breachFormLanguage: 'pl',
  },

  PT: {
    name: 'Comissão Nacional de Proteção de Dados (CNPD)',
    nameEnglish: 'National Commission for Data Protection',
    abbreviation: 'CNPD',
    website: 'https://www.cnpd.pt/',
    contactEmail: 'geral@cnpd.pt',
    contactPhone: '+351 21 392 84 00',
    address: { street: 'Rua de São Bento, 148, 3.°', city: 'Lisboa', postalCode: '1200-821', country: 'PT' },
    nationalLaw: 'Lei n.º 58/2019',
    guidanceLanguage: 'pt',
    breachFormLanguage: 'pt',
  },

  RO: {
    name: 'Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)',
    nameEnglish: 'National Supervisory Authority for Personal Data Processing',
    abbreviation: 'ANSPDCP',
    website: 'https://www.dataprotection.ro/',
    contactEmail: 'anspdcp@dataprotection.ro',
    contactPhone: '+40 318 059 211',
    address: { street: 'B-dul G-ral. Gheorghe Magheru 28-30', city: 'București', postalCode: '010336', country: 'RO' },
    nationalLaw: 'Law No. 190/2018',
    guidanceLanguage: 'ro',
    breachFormLanguage: 'ro',
  },

  SK: {
    name: 'Úrad na ochranu osobných údajov SR',
    nameEnglish: 'Office for Personal Data Protection of the Slovak Republic',
    abbreviation: 'ÚOOU SR',
    website: 'https://dataprotection.gov.sk/',
    contactEmail: 'statny.dozor@pdp.gov.sk',
    contactPhone: '+421 2 3231 3214',
    address: { street: 'Hraničná 12', city: 'Bratislava', postalCode: '820 07', country: 'SK' },
    nationalLaw: 'Act No. 18/2018 Coll. on Personal Data Protection',
    guidanceLanguage: 'sk',
    breachFormLanguage: 'sk',
  },

  SI: {
    name: 'Informacijski pooblaščenec (IP)',
    nameEnglish: 'Information Commissioner',
    abbreviation: 'IP',
    website: 'https://www.ip-rs.si/',
    contactEmail: 'gp.ip@ip-rs.si',
    contactPhone: '+386 1 230 97 30',
    address: { street: 'Dunajska cesta 22', city: 'Ljubljana', postalCode: '1000', country: 'SI' },
    nationalLaw: 'Personal Data Protection Act (ZVOP-2)',
    guidanceLanguage: 'sl',
    breachFormLanguage: 'sl',
  },

  ES: {
    name: 'Agencia Española de Protección de Datos (AEPD)',
    nameEnglish: 'Spanish Data Protection Agency',
    abbreviation: 'AEPD',
    website: 'https://www.aepd.es/',
    breachNotificationUrl: 'https://sedeagpd.gob.es/sede-electronica-web/vistas/formBrechaSeguridad/inicio.jsf',
    breachNotificationMethod: 'online_portal',
    contactEmail: null, // Uses online forms
    contactPhone: '+34 901 100 099',
    address: { street: 'C/ Jorge Juan, 6', city: 'Madrid', postalCode: '28001', country: 'ES' },
    nationalLaw: 'Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)',
    guidanceLanguage: 'es',
    breachFormLanguage: 'es',
    // Spain also has regional DPAs: Catalonia (APDCAT) and Basque Country
    regionalDpas: {
      'ES-CT': { name: 'Autoritat Catalana de Protecció de Dades (APDCAT)', website: 'https://apdcat.gencat.cat/' },
      'ES-PV': { name: 'Datuak Babesteko Euskal Bulegoa (AVPD)', website: 'https://www.avpd.euskadi.eus/' },
    },
  },

  SE: {
    name: 'Integritetsskyddsmyndigheten (IMY)',
    nameEnglish: 'Swedish Authority for Privacy Protection',
    abbreviation: 'IMY',
    website: 'https://www.imy.se/',
    breachNotificationUrl: 'https://www.imy.se/en/organisations/report-a-personal-data-breach/',
    breachNotificationMethod: 'online_form',
    contactEmail: 'imy@imy.se',
    contactPhone: '+46 8 657 61 00',
    address: { street: 'Drottninggatan 29', city: 'Stockholm', postalCode: '104 20', country: 'SE' },
    nationalLaw: 'Lag (2018:218) med kompletterande bestämmelser till EU:s dataskyddsförordning',
    guidanceLanguage: 'sv',
    breachFormLanguage: 'sv,en',
  },

  // EEA NON-EU
  NO: {
    name: 'Datatilsynet',
    nameEnglish: 'Norwegian Data Protection Authority',
    abbreviation: 'Datatilsynet',
    website: 'https://www.datatilsynet.no/',
    breachNotificationUrl: 'https://www.datatilsynet.no/en/regulations-and-tools/regulations/personal-data-breach/',
    contactEmail: 'postkasse@datatilsynet.no',
    contactPhone: '+47 22 39 69 00',
    address: { street: 'Tollbugt 3', city: 'Oslo', postalCode: '0152', country: 'NO' },
    nationalLaw: 'Personopplysningsloven (Personal Data Act)',
    guidanceLanguage: 'nb',
    breachFormLanguage: 'nb',
  },

  IS: {
    name: 'Persónuvernd',
    nameEnglish: 'Icelandic Data Protection Authority',
    abbreviation: 'Persónuvernd',
    website: 'https://www.personuvernd.is/',
    contactEmail: 'postur@personuvernd.is',
    contactPhone: '+354 510 9600',
    address: { street: 'Rauðarárstígur 10', city: 'Reykjavík', postalCode: '105', country: 'IS' },
    nationalLaw: 'Act on Data Protection and the Processing of Personal Data No. 90/2018',
    guidanceLanguage: 'is',
    breachFormLanguage: 'is',
  },

  LI: {
    name: 'Datenschutzstelle (DSS)',
    nameEnglish: 'Data Protection Authority of Liechtenstein',
    abbreviation: 'DSS',
    website: 'https://www.datenschutzstelle.li/',
    contactEmail: 'info.dss@llv.li',
    contactPhone: '+423 236 60 90',
    address: { street: 'Städtle 38', city: 'Vaduz', postalCode: '9490', country: 'LI' },
    nationalLaw: 'Data Protection Act (DSG)',
    guidanceLanguage: 'de',
    breachFormLanguage: 'de',
  },
};
```

### Country-Specific Legal Variations

```typescript
// packages/shared/src/constants/national-legal-variations.ts

export const NATIONAL_LEGAL_VARIATIONS: Record<string, NationalVariation> = {

  // DIGITAL CONSENT AGE (Art. 8 GDPR — each country can set between 13-16)
  digitalConsentAge: {
    13: ['BE', 'DK', 'EE', 'FI', 'LV', 'MT', 'PT', 'SE', 'NO', 'IS'],
    14: ['AT', 'BG', 'CY', 'ES', 'IT', 'LT'],
    15: ['CZ', 'FR', 'GR', 'SI'],
    16: ['DE', 'HR', 'HU', 'IE', 'LU', 'NL', 'PL', 'RO', 'SK', 'LI'], // 16 is the GDPR default
  },

  // EMPLOYEE DATA PROCESSING — country-specific requirements
  employeeDataRules: {
    DE: 'Section 26 BDSG — specific rules for employee data processing. Works councils have co-determination rights.',
    FR: 'CNIL guidance on employee monitoring. Strict rules on CCTV and email monitoring.',
    NL: 'Works Council Act gives employee representatives say in data processing decisions.',
    // ... additional per country
  },

  // BREACH NOTIFICATION SPECIFICS
  breachNotification: {
    // Most countries follow standard GDPR 72-hour rule
    // Some have additional national requirements:
    DE: 'Must notify the STATE-level DPA, not federal BfDI (for private sector). Identify correct Landesbeauftragte.',
    ES: 'AEPD online portal is mandatory for breach notifications. Paper submissions not accepted.',
    FR: 'CNIL online portal. Must create a CNIL account first. Can be done in stages — initial within 72h, full within 30 days.',
    NL: 'AP datalekken portal. Dutch DPA is particularly active on breach enforcement.',
    IE: 'DPC online form. Critical for big tech companies — high scrutiny.',
  },

  // ADDITIONAL NATIONAL SANCTIONS/PENALTIES BEYOND GDPR
  additionalPenalties: {
    DE: 'BDSG adds criminal penalties (up to 3 years imprisonment) for intentional unauthorized data processing.',
    FR: 'Code pénal — criminal penalties for data protection violations up to 5 years / €300,000.',
    GR: 'Criminal penalties under Law 4624/2019.',
    HU: 'NAIH can impose fines based on turnover with minimum thresholds.',
  },

  // DPO APPOINTMENT — stricter national rules
  dpoRequirements: {
    DE: 'Mandatory for companies with 20+ employees regularly processing personal data.',
    FR: 'Recommended for all public bodies + specific private sector criteria.',
    // GDPR default: Required for public authorities, large-scale systematic monitoring, large-scale special categories
  },
};
```

---

## Internationalization & Language System

### Supported Languages (24 EU Official Languages + EEA)

```typescript
// packages/shared/src/constants/eu-languages.ts

export const SUPPORTED_LOCALES = {
  en: { name: 'English',    nativeName: 'English',     direction: 'ltr', flag: '🇬🇧', countries: ['IE', 'MT'] },
  de: { name: 'German',     nativeName: 'Deutsch',     direction: 'ltr', flag: '🇩🇪', countries: ['DE', 'AT', 'LU', 'LI', 'BE'] },
  fr: { name: 'French',     nativeName: 'Français',    direction: 'ltr', flag: '🇫🇷', countries: ['FR', 'BE', 'LU'] },
  it: { name: 'Italian',    nativeName: 'Italiano',    direction: 'ltr', flag: '🇮🇹', countries: ['IT'] },
  es: { name: 'Spanish',    nativeName: 'Español',     direction: 'ltr', flag: '🇪🇸', countries: ['ES'] },
  pt: { name: 'Portuguese', nativeName: 'Português',   direction: 'ltr', flag: '🇵🇹', countries: ['PT'] },
  nl: { name: 'Dutch',      nativeName: 'Nederlands',  direction: 'ltr', flag: '🇳🇱', countries: ['NL', 'BE'] },
  pl: { name: 'Polish',     nativeName: 'Polski',      direction: 'ltr', flag: '🇵🇱', countries: ['PL'] },
  ro: { name: 'Romanian',   nativeName: 'Română',      direction: 'ltr', flag: '🇷🇴', countries: ['RO'] },
  el: { name: 'Greek',      nativeName: 'Ελληνικά',    direction: 'ltr', flag: '🇬🇷', countries: ['GR', 'CY'] },
  cs: { name: 'Czech',      nativeName: 'Čeština',     direction: 'ltr', flag: '🇨🇿', countries: ['CZ'] },
  hu: { name: 'Hungarian',  nativeName: 'Magyar',      direction: 'ltr', flag: '🇭🇺', countries: ['HU'] },
  sv: { name: 'Swedish',    nativeName: 'Svenska',     direction: 'ltr', flag: '🇸🇪', countries: ['SE', 'FI'] },
  da: { name: 'Danish',     nativeName: 'Dansk',       direction: 'ltr', flag: '🇩🇰', countries: ['DK'] },
  fi: { name: 'Finnish',    nativeName: 'Suomi',       direction: 'ltr', flag: '🇫🇮', countries: ['FI'] },
  sk: { name: 'Slovak',     nativeName: 'Slovenčina',  direction: 'ltr', flag: '🇸🇰', countries: ['SK'] },
  bg: { name: 'Bulgarian',  nativeName: 'Български',   direction: 'ltr', flag: '🇧🇬', countries: ['BG'] },
  hr: { name: 'Croatian',   nativeName: 'Hrvatski',    direction: 'ltr', flag: '🇭🇷', countries: ['HR'] },
  lt: { name: 'Lithuanian', nativeName: 'Lietuvių',    direction: 'ltr', flag: '🇱🇹', countries: ['LT'] },
  lv: { name: 'Latvian',    nativeName: 'Latviešu',    direction: 'ltr', flag: '🇱🇻', countries: ['LV'] },
  et: { name: 'Estonian',   nativeName: 'Eesti',       direction: 'ltr', flag: '🇪🇪', countries: ['EE'] },
  sl: { name: 'Slovenian',  nativeName: 'Slovenščina', direction: 'ltr', flag: '🇸🇮', countries: ['SI'] },
  mt: { name: 'Maltese',    nativeName: 'Malti',       direction: 'ltr', flag: '🇲🇹', countries: ['MT'] },
  ga: { name: 'Irish',      nativeName: 'Gaeilge',     direction: 'ltr', flag: '🇮🇪', countries: ['IE'] },
  // EEA non-EU
  nb: { name: 'Norwegian',  nativeName: 'Norsk bokmål', direction: 'ltr', flag: '🇳🇴', countries: ['NO'] },
  is: { name: 'Icelandic',  nativeName: 'Íslenska',    direction: 'ltr', flag: '🇮🇸', countries: ['IS'] },
} as const;

export const DEFAULT_LOCALE = 'en';
export const LOCALE_COOKIE_NAME = 'GDPR_LOCALE';
```

### i18n Implementation Architecture

```typescript
// apps/web/lib/i18n/config.ts (next-intl configuration)

import { getRequestConfig } from 'next-intl/server';

export const locales = Object.keys(SUPPORTED_LOCALES);
export const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../../messages/${locale}.json`)).default,
  timeZone: 'Europe/Brussels', // Default; override per user
  now: new Date(),
}));

// apps/web/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales,
  defaultLocale: 'en',
  localeDetection: true,    // Auto-detect from Accept-Language
  localePrefix: 'always',   // Always show /en/, /de/, /fr/ in URL
});

// Translation file structure example:
// messages/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "auth": {
    "login": "Log in",
    "register": "Create account",
    "email": "Email address",
    "password": "Password",
    "forgotPassword": "Forgot your password?"
  },
  "onboarding": {
    "countrySelection": {
      "title": "Where is your company registered?",
      "subtitle": "This determines your applicable data protection authority and legal requirements",
      "searchPlaceholder": "Search countries...",
      "euMembers": "EU Member States",
      "eeaMembers": "EEA Members"
    },
    "companyDetails": {
      "registrationNumber": "Company registration number",
      "registrationNumberHelp": "Your {registrationNumberLabel} as shown on your {documentName}",
      "vatNumber": "VAT number (optional)",
      "legalName": "Legal company name"
    }
  },
  "dashboard": { ... },
  "dsr": { ... },
  "breach": { ... },
  "consent": { ... },
  "ai": {
    "assistant": {
      "title": "AI Compliance Assistant",
      "placeholder": "Ask me about GDPR compliance...",
      "disclaimer": "AI responses are for guidance only and do not constitute legal advice.",
      "suggestedQuestions": [
        "Do I need a DPIA for my processing activity?",
        "How do I respond to a data access request?",
        "What is the lawful basis for marketing emails?"
      ]
    }
  }
}

// WHAT GETS TRANSLATED:
// ✅ All UI text (buttons, labels, headings, messages)
// ✅ Error messages
// ✅ Email templates (auth, DSR responses, breach notifications)
// ✅ Consent banner text
// ✅ Training course content
// ✅ Generated compliance reports
// ✅ GDPR article references and explanations
// ✅ Onboarding questionnaire
// ✅ AI assistant system prompts (for correct language responses)
//
// ❌ NOT translated (kept in original language):
// ❌ Legal document names (national law references)
// ❌ DPA names (kept in official language + English)
// ❌ Audit logs (always English for consistency)
// ❌ API responses (always English, frontend translates)

// TRANSLATION MANAGEMENT:
// Use Crowdin (or Lokalise/Phrase) for managing translations
// Workflow:
// 1. Developers add English strings to en.json
// 2. CI pushes new strings to Crowdin
// 3. Professional translators translate (legal/compliance terminology is sensitive!)
// 4. CI pulls completed translations back
// 5. Use ICU MessageFormat for pluralization, gender, numbers
// 6. Legal/compliance terms MUST be reviewed by native-speaking legal professionals
```

---

## AI Compliance Assistant

### Architecture

```
┌───────────────────────────────────────────────────────┐
│                  User Chat Interface                    │
│  (React component with streaming response display)     │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│                  API Route (/api/ai/chat)               │
│  - Validate user permissions                           │
│  - Rate limit (30 messages/hour per user)              │
│  - Load org context (country, industry, assets)         │
│  - Determine language from user preference              │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│              AI Assistant Service                       │
│                                                        │
│  1. Build system prompt                                │
│     ├── Base compliance prompt                         │
│     ├── Country-specific context ({country} law)       │
│     ├── Organization context (industry, size, assets)   │
│     ├── User's language instruction                    │
│     └── Tool definitions                               │
│                                                        │
│  2. RAG: Retrieve relevant legal context               │
│     ├── Query vector store with user question          │
│     ├── Retrieve relevant GDPR articles                │
│     ├── Retrieve relevant national law sections         │
│     ├── Retrieve relevant DPA guidance                  │
│     └── Inject as context into prompt                  │
│                                                        │
│  3. Call Anthropic Claude API                          │
│     ├── Model: claude-sonnet-4-20250514                │
│     ├── Stream response                                │
│     ├── Handle tool calls                              │
│     └── Respect token limits                           │
│                                                        │
│  4. Post-process                                       │
│     ├── Log conversation + tokens used                 │
│     ├── Save to AiConversation/AiMessage               │
│     └── Audit log entry                                │
└───────────────────────────────────────────────────────┘
```

### System Prompt Design

```typescript
// apps/api/src/modules/ai-assistant/prompts/system-prompt.ts

export function buildSystemPrompt(context: AiContext): string {
  return `You are a GDPR compliance assistant integrated into a compliance management platform.

## Your Role
- Help users understand and comply with GDPR and applicable national data protection laws
- Provide practical, actionable guidance specific to their situation
- Reference specific GDPR articles, recitals, and national law provisions
- Help draft compliance documents (privacy policies, DPIAs, breach notifications)
- Assess processing activities for compliance risks
- NEVER provide definitive legal advice — always recommend consulting a qualified lawyer for complex matters

## Organization Context
- Company: ${context.orgName}
- Country of registration: ${context.country} (${context.countryName})
- Applicable DPA: ${context.dpaName} (${context.dpaAbbreviation})
- National GDPR implementation: ${context.nationalLaw}
- Industry: ${context.industry}
- Company size: ${context.companySize}
- Digital consent age in ${context.countryName}: ${context.digitalConsentAge}
${context.stateDpa ? `- State-level DPA: ${context.stateDpa}` : ''}

## Language
Respond in ${context.language} (${context.languageName}).
Use the legal terminology appropriate for ${context.countryName}.
When citing GDPR articles, provide the article number and a brief explanation.
When citing national law, use the official name: ${context.nationalLaw}.

## Tools Available
You can use the following tools to help the user:
- compliance_check: Assess a processing activity against GDPR requirements
- dpia_screening: Determine if a DPIA is needed for a described processing activity
- draft_policy: Generate a draft privacy policy section
- breach_assessment: Assess breach severity and notification requirements
- dsr_guidance: Provide step-by-step DSR handling guidance
- lawful_basis_advisor: Help determine the appropriate lawful basis

## Important Rules
1. Always cite specific GDPR articles when relevant (e.g., "Under Article 6(1)(a)...")
2. Mention country-specific requirements for ${context.countryName} when they differ from base GDPR
3. Flag when professional legal advice is recommended
4. Do not store, process, or reference actual personal data from the user's systems
5. If unsure, say so — do not fabricate legal guidance
6. Be aware of the latest DPA guidance and enforcement trends for ${context.countryName}
7. When discussing breach notification, always mention the ${context.dpaAbbreviation} specifically and their reporting process`;
}
```

### RAG Pipeline

```typescript
// apps/api/src/modules/ai-assistant/rag/

// Vector Store: PostgreSQL with pgvector extension
// Alternative: Pinecone, Qdrant, or Weaviate

// Document corpus:
// 1. GDPR full text (99 articles + 173 recitals) — all 24 language versions
// 2. National implementation laws (30 countries)
// 3. EDPB guidelines and opinions
// 4. National DPA guidance documents
// 5. CJEU (Court of Justice) relevant case law summaries
// 6. Platform's own knowledge base articles

// Embedding model: text-embedding-3-small (OpenAI) or multilingual-e5-large
// Chunk size: ~500 tokens with 100 token overlap
// Retrieval: Top-k (k=5) most relevant chunks per query

// Pre-processing pipeline:
// 1. Load legal documents (JSON/markdown format)
// 2. Split into semantic chunks (respect article/section boundaries)
// 3. Tag with metadata: { source, country, language, article_number, topic }
// 4. Generate embeddings
// 5. Store in pgvector

// Query pipeline:
// 1. User asks question
// 2. Detect language of question
// 3. Expand query with legal synonyms
// 4. Embed query
// 5. Retrieve top-k chunks, filtered by org's country
// 6. Re-rank by relevance
// 7. Inject into Claude prompt as context
```

### AI Tool Definitions

```typescript
// apps/api/src/modules/ai-assistant/tools/

export const AI_TOOLS = [
  {
    name: 'compliance_check',
    description: 'Assess a data processing activity against GDPR requirements. Identifies gaps and provides recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        processing_description: { type: 'string', description: 'Description of the processing activity' },
        data_categories: { type: 'array', items: { type: 'string' }, description: 'Types of personal data processed' },
        lawful_basis: { type: 'string', description: 'Claimed lawful basis' },
        data_subjects: { type: 'array', items: { type: 'string' }, description: 'Categories of data subjects' },
      },
      required: ['processing_description'],
    },
  },
  {
    name: 'dpia_screening',
    description: 'Determine whether a Data Protection Impact Assessment is required based on Article 35 criteria and national DPA blacklists/whitelists.',
    input_schema: {
      type: 'object',
      properties: {
        processing_description: { type: 'string' },
        involves_profiling: { type: 'boolean' },
        involves_automated_decisions: { type: 'boolean' },
        large_scale: { type: 'boolean' },
        sensitive_data: { type: 'boolean' },
        public_monitoring: { type: 'boolean' },
        innovative_technology: { type: 'boolean' },
      },
      required: ['processing_description'],
    },
  },
  {
    name: 'breach_assessment',
    description: 'Assess a data breach for severity, notification requirements, and recommended actions.',
    input_schema: {
      type: 'object',
      properties: {
        breach_description: { type: 'string' },
        data_types_affected: { type: 'array', items: { type: 'string' } },
        number_of_individuals: { type: 'number' },
        data_encrypted: { type: 'boolean' },
        breach_contained: { type: 'boolean' },
      },
      required: ['breach_description'],
    },
  },
  {
    name: 'draft_policy',
    description: 'Generate a draft section of a privacy policy, data processing agreement, or other compliance document.',
    input_schema: {
      type: 'object',
      properties: {
        document_type: { type: 'string', enum: ['privacy_policy', 'dpa', 'consent_text', 'dpia_section', 'breach_notification', 'dsr_response'] },
        section: { type: 'string', description: 'Which section to draft' },
        context: { type: 'string', description: 'Additional context for drafting' },
        language: { type: 'string', description: 'Language for the draft' },
      },
      required: ['document_type'],
    },
  },
  {
    name: 'lawful_basis_advisor',
    description: 'Help determine the most appropriate lawful basis for a processing activity.',
    input_schema: {
      type: 'object',
      properties: {
        processing_purpose: { type: 'string' },
        data_subject_relationship: { type: 'string' },
        data_categories: { type: 'array', items: { type: 'string' } },
        is_necessary_for_contract: { type: 'boolean' },
        is_legal_obligation: { type: 'boolean' },
      },
      required: ['processing_purpose'],
    },
  },
];

// Rate limiting for AI:
// - 30 messages per hour per user
// - 500 messages per day per organization
// - Token budget: 100,000 tokens/day per org (starter), 500,000 (professional), unlimited (enterprise)
// - Context window management: keep last 20 messages, summarize older ones
```

### AI Chat UI Component

```typescript
// apps/web/components/ai-chat/AiChat.tsx

// Features:
// - Streaming response display (word by word)
// - Message history with conversation threads
// - Suggested starter questions (localized per country)
// - Tool call visualizations (show when AI is checking compliance, drafting, etc.)
// - Copy response button
// - Thumbs up/down feedback for response quality
// - Export conversation as PDF/markdown
// - Persistent disclaimer: "AI responses are for guidance only and do not constitute legal advice."
// - Language matches user's selected locale
// - Accessible: keyboard navigation, screen reader support, high contrast mode
// - Mobile-responsive: full-screen chat on mobile
// - Dark mode support
```

---

## Core Modules

(Same as original document — Data Mapping, Consent Management, DSR Automation, Breach Management, Vendor Risk Management, DPIA, Training, Reporting. All apply unchanged.)

**Key additions to core modules for EU-wide support:**

1. **Consent SDK** — Cookie banner text in all 24 languages. Geo-detection to show correct language automatically.
2. **DSR Portal** — Public-facing form available in all 24 languages. Auto-detects user language.
3. **Breach Notification** — Templates pre-built for each DPA's required format and language. Links to correct DPA portal per country.
4. **DPIA Module** — Country-specific DPIA blacklists/whitelists loaded per DPA. Some DPAs publish lists of processing types that always/never require a DPIA.
5. **Training** — Training content available in all 24 languages. Country-specific modules for national law requirements.
6. **Reporting** — Generated reports in the org's primary language. ROPA export in the language required by the applicable DPA.

---

## Security Safeguards

(Same as original document — all encryption, tenant isolation, audit logging, security headers, etc. apply unchanged. See original section.)

**Additional safeguard for EU compliance:**

```typescript
// DATA RESIDENCY
// CRITICAL: All data MUST remain within the EU/EEA
// Infrastructure: AWS eu-central-1 (Frankfurt) primary, eu-west-1 (Ireland) failover
// S3 buckets: eu-central-1 only, bucket policies prevent replication outside EU
// Database: RDS Multi-AZ within EU region
// Redis: ElastiCache in EU region
// CDN: CloudFront with EU-only edge locations (if needed for latency)
// Backups: S3 cross-region replication only to other EU regions
// No sub-processors outside EU/EEA without explicit client consent + adequate safeguards
```

---

## API Architecture

(Same as original document. All routes apply. See original section.)

**Additional API routes for new modules:**

```
/api/v1/
├── ... (all original routes)
│
├── /countries
│   ├── GET    /                        # List all supported EU/EEA countries
│   ├── GET    /:code                   # Get country details (DPA, laws, verification config)
│   ├── GET    /:code/dpa               # Get DPA details for country
│   ├── GET    /:code/legal-framework   # Get national law details
│   └── GET    /:code/verification-config # Get verification requirements
│
├── /languages
│   ├── GET    /                        # List supported languages
│   └── PATCH  /preference              # Update user language preference
│
├── /ai
│   ├── POST   /conversations           # Create new AI conversation
│   ├── GET    /conversations           # List user's conversations
│   ├── GET    /conversations/:id        # Get conversation with messages
│   ├── POST   /conversations/:id/messages # Send message (streaming response)
│   ├── DELETE /conversations/:id        # Archive conversation
│   ├── POST   /conversations/:id/feedback # Rate a response
│   └── GET    /usage                    # AI usage stats for org
│
└── /legal
    ├── GET    /gdpr/articles            # List GDPR articles
    ├── GET    /gdpr/articles/:number    # Get specific article (in requested language)
    ├── GET    /national-law/:countryCode # Get national law overview
    └── GET    /guidance/:countryCode     # Get DPA guidance links
```

---

## Infrastructure & Deployment

(Same as original document. Docker Compose, AWS architecture, env vars all apply.)

**Additional environment variables:**

```bash
# .env.example — additions to original

# AI Assistant
ANTHROPIC_API_KEY=<key>
AI_MODEL=claude-sonnet-4-20250514
AI_MAX_TOKENS_PER_REQUEST=4096
AI_RATE_LIMIT_PER_USER_HOUR=30
AI_RATE_LIMIT_PER_ORG_DAY=500

# Vector Store (for RAG)
PGVECTOR_CONNECTION_STRING=postgresql://user:pass@host:5432/gdpr_vectors

# Translation Management
CROWDIN_PROJECT_ID=<id>
CROWDIN_API_TOKEN=<token>

# Country Verification APIs
COMPANIES_HOUSE_API_KEY=<key>           # UK (for reference clients)
OPENCORPORATES_API_TOKEN=<token>        # Global fallback
ARES_API_KEY=<key>                      # Czech Republic (free, but needs registration)
CVRAPI_KEY=<key>                        # Denmark (free)
SIRENE_API_TOKEN=<token>                # France INSEE (free, needs registration)
KVK_API_KEY=<key>                       # Netherlands
PRH_API_KEY=<key>                       # Finland (free, open data)
BRREG_API_KEY=none                      # Norway (free, no key needed)
KRS_API_KEY=none                        # Poland (free, no key needed)
INFOCAMERE_API_KEY=<key>                # Italy (paid)
NORTH_DATA_API_KEY=<key>                # Germany premium (paid)

# VIES VAT (free, no key)
VIES_REST_ENDPOINT=https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number

# Address Validation
GOOGLE_PLACES_API_KEY=<key>
BAN_API_ENDPOINT=https://api-adresse.data.gouv.fr  # France (free)
DAWA_API_ENDPOINT=https://api.dataforsyningen.dk    # Denmark (free)

# Data Residency
AWS_REGION=eu-central-1
AWS_FAILOVER_REGION=eu-west-1
```

---

## Testing Strategy

(Same as original document — all testing applies.)

**Additional tests for new modules:**

```
7. Country Verification Tests
   - Test each country's registration number format validation
   - Test verification flow for countries with APIs (CZ, DK, FI, FR, NL, NO, PL)
   - Test fallback to OpenCorporates for countries without APIs
   - Test VIES VAT validation for all EU countries
   - Test address validation per country

8. i18n Tests
   - Verify all translation keys exist in all 26 language files
   - Test locale detection from Accept-Language header
   - Test locale persistence across sessions
   - Test RTL support (none needed currently but good to have)
   - Test date/number formatting per locale
   - Test that generated documents use org's primary language
   - Screenshot tests for major pages in each language

9. AI Assistant Tests
   - Test rate limiting per user and per org
   - Test context injection (correct country, DPA, national law)
   - Test language of responses matches user preference
   - Test tool calling (compliance check, DPIA screening, etc.)
   - Test conversation persistence and retrieval
   - Test token budget enforcement
   - Test streaming response delivery
   - Test RAG retrieval relevance (country-specific results)
```

---

## Build Order & Implementation Plan

### Phase 1: Foundation (Weeks 1-4)

```
1. Project scaffolding (monorepo with Turborepo)
2. Database schema + Prisma setup + initial migration
3. EU country seed data (30 countries, DPAs, verification configs)
4. i18n foundation (next-intl setup, English + 5 major languages: DE, FR, ES, IT, NL)
5. Language switcher component
6. Authentication system (register, login, email verification, JWT, MFA)
7. Country selection component and onboarding flow
8. RBAC middleware
9. Organization CRUD with country association
10. Tenant isolation middleware
11. Audit logging infrastructure
12. Encryption utilities
13. Basic dashboard layout
```

### Phase 2: Company Verification (Weeks 5-7)

```
1. Verification provider interface + factory pattern
2. OpenCorporates integration (fallback for all countries)
3. VIES VAT validation (all EU countries)
4. Country-specific providers:
   - Czech Republic (ARES API — free, excellent)
   - Denmark (CVR API — free, excellent)
   - Finland (PRH API — free, excellent)
   - France (SIRENE API — free)
   - Netherlands (KVK API)
   - Norway (Brønnøysund API — free, excellent)
   - Poland (KRS API — free)
5. Address verification (Google Places)
6. Document upload + S3 storage
7. Verification scoring engine
8. Admin review interface for manual verification
9. Verification status dashboard
10. DPA auto-assignment based on country
```

### Phase 3: Core Compliance Modules (Weeks 8-13)

```
(Same as original Phase 3, with i18n applied to all UI)
1. Onboarding questionnaire (country-aware) + gap analysis
2. Data asset management
3. Processing activity registry (ROPA)
4. Consent management platform + multilingual SDK
5. DSR automation (multilingual intake portal)
6. Basic reporting dashboard
```

### Phase 4: Advanced Modules (Weeks 14-19)

```
(Same as original Phase 4, with country-specific legal context)
1. Breach management (country-specific DPA notification templates)
2. Vendor risk management
3. DPIA wizard (with national DPA blacklists/whitelists)
4. Training module (multilingual content)
5. Integration connectors
```

### Phase 5: AI Assistant + Intelligence (Weeks 20-26)

```
1. Legal corpus ingestion (GDPR + 30 national laws)
2. RAG pipeline (embeddings, vector store, retrieval)
3. AI assistant service (Anthropic Claude integration)
4. AI tool implementations (compliance check, DPIA screening, etc.)
5. Chat UI component with streaming
6. Conversation persistence and history
7. AI rate limiting and token budgets
8. Automated data scanning pipeline
9. PII detection microservice (multilingual NER models)
10. Data flow visualization
11. Compliance score algorithm
12. Automated report generation (multilingual)
```

### Phase 6: Full i18n Rollout (Weeks 27-29)

```
1. Complete translations for all 26 language files
2. Professional legal review of translated compliance terms
3. Country-specific onboarding flows for all 30 countries
4. DPA breach notification templates in all required languages
5. Consent banner translations for all 24 EU languages
6. Training content translation
7. Email template translations
```

### Phase 7: Production Readiness (Weeks 30-34)

```
(Same as original Phase 6, expanded)
1. Security audit + penetration testing
2. Performance optimization + load testing
3. SOC 2 Type I preparation
4. ISO 27001 alignment
5. GDPR compliance of the platform itself
6. Data residency verification (all data in EU)
7. Documentation (API docs, user guides — multilingual)
8. Monitoring + alerting setup
9. Disaster recovery + backup procedures
10. Legal review of platform terms (per-country variations)
11. Beta launch with pilot customers in 5 countries
12. Gradual rollout across all 30 countries
```

---

## Key Compliance Notes for the Platform Itself

(Same as original document — all 12 points apply.)

---

## Notes for Claude Code / Cursor Development

When using this document with Claude Code or Cursor:

1. **Start with Phase 1** — Get the foundation right before building features
2. **Generate one module at a time** — Each module is self-contained
3. **Use the Prisma schema as the source of truth** — Generate types from it
4. **Test as you go** — Write tests alongside implementation
5. **Security first** — Every endpoint needs auth + RBAC + validation + audit logging
6. **The audit log is sacred** — Never skip logging, never allow deletion
7. **Encryption is non-negotiable** — All PII encrypted at rest
8. **Tenant isolation is critical** — Every query must be scoped to the org
9. **Use the GDPR articles as requirements** — Map every feature to specific articles
10. **Keep the compliance rules engine configurable** — GDPR evolves through case law
11. **Country context is always required** — Every org has a country; use it to load correct DPA, national law, verification provider, and digital consent age
12. **i18n from day one** — Use translation keys from the start; never hardcode user-facing strings
13. **AI assistant is contextual** — Always inject org country, DPA, and national law into the system prompt
14. **Data residency is non-negotiable** — All infrastructure MUST be in EU. Verify no data leaves EU borders.
15. **Verification providers vary by country** — Use the factory pattern; some countries have excellent free APIs (CZ, DK, FI, NO, PL), others need OpenCorporates as fallback
16. **Legal terminology must be precise** — Translations of compliance terms must be reviewed by native legal professionals
17. **German companies need state selection** — Germany has 16 state-level DPAs; the platform must ask which Bundesland
18. **Spain has regional DPAs** — Catalonia and Basque Country have their own
19. **Greece uses EL for VAT** — Not GR. This is a common gotcha
20. **AI tool calls must be logged** — Every AI interaction is an audit event

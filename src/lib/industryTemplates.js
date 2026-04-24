/**
 * Industry-specific seed data for auto-population on onboarding.
 * Each industry has: staff, services, and faq (stored on Business.description as structured content).
 */

export const INDUSTRY_TEMPLATES = {
  salon: {
    businessHours: {
      monday:    { open: true,  open_time: '09:00', close_time: '18:00' },
      tuesday:   { open: true,  open_time: '09:00', close_time: '18:00' },
      wednesday: { open: true,  open_time: '09:00', close_time: '20:00' },
      thursday:  { open: true,  open_time: '09:00', close_time: '20:00' },
      friday:    { open: true,  open_time: '09:00', close_time: '18:00' },
      saturday:  { open: true,  open_time: '08:00', close_time: '17:00' },
      sunday:    { open: false, open_time: '10:00', close_time: '15:00' },
    },
    staff: [
      { name: 'Sophie Clarke', role: 'Senior Stylist', color: '#8B5CF6', assigned_services: ['Haircut & Style', 'Balayage', 'Colour Treatment'] },
      { name: 'Mia Nguyen', role: 'Colourist', color: '#EC4899', assigned_services: ['Balayage', 'Colour Treatment', 'Toning'] },
      { name: 'Jake Thompson', role: 'Junior Stylist', color: '#3B82F6', assigned_services: ['Haircut & Style', 'Blow Dry'] },
      { name: 'Chloe Davis', role: 'Nail Technician', color: '#10B981', assigned_services: ['Manicure', 'Pedicure', 'Gel Nails'] },
    ],
    services: [
      { name: 'Haircut & Style', category: 'Hair', duration_minutes: 60, price: 85, color: '#8B5CF6' },
      { name: 'Blow Dry', category: 'Hair', duration_minutes: 45, price: 55, color: '#8B5CF6' },
      { name: 'Balayage', category: 'Colour', duration_minutes: 180, price: 250, color: '#EC4899' },
      { name: 'Colour Treatment', category: 'Colour', duration_minutes: 120, price: 150, color: '#EC4899' },
      { name: 'Toning', category: 'Colour', duration_minutes: 60, price: 80, color: '#EC4899' },
      { name: 'Manicure', category: 'Nails', duration_minutes: 45, price: 45, color: '#10B981' },
      { name: 'Pedicure', category: 'Nails', duration_minutes: 60, price: 55, color: '#10B981' },
      { name: 'Gel Nails', category: 'Nails', duration_minutes: 75, price: 65, color: '#10B981' },
    ],
    faq: [
      { q: 'How do I book an appointment?', a: 'You can book by calling us, using our online booking link, or asking me right now — I can check availability and book you in instantly.' },
      { q: 'Do you take walk-ins?', a: 'We do accept walk-ins based on availability, but we recommend booking in advance especially for colour services.' },
      { q: 'How long does a balayage take?', a: 'A balayage typically takes between 2.5 to 3 hours depending on hair length and desired result.' },
      { q: 'What is your cancellation policy?', a: 'We ask for 24 hours notice for cancellations. Late cancellations or no-shows may incur a fee.' },
      { q: 'Do you offer gift vouchers?', a: 'Yes! We offer gift vouchers for any amount or service. Ask our team in-salon or call us to arrange.' },
    ],
  },

  clinic: {
    businessHours: {
      monday:    { open: true,  open_time: '08:00', close_time: '17:00' },
      tuesday:   { open: true,  open_time: '08:00', close_time: '17:00' },
      wednesday: { open: true,  open_time: '08:00', close_time: '17:00' },
      thursday:  { open: true,  open_time: '08:00', close_time: '17:00' },
      friday:    { open: true,  open_time: '08:00', close_time: '16:00' },
      saturday:  { open: true,  open_time: '09:00', close_time: '12:00' },
      sunday:    { open: false, open_time: '09:00', close_time: '12:00' },
    },
    staff: [
      { name: 'Dr. Sarah Mitchell', role: 'General Practitioner', color: '#3B82F6', assigned_services: ['General Consultation', 'Health Check', 'Chronic Disease Management'] },
      { name: 'Dr. James Patel', role: 'GP', color: '#8B5CF6', assigned_services: ['General Consultation', 'Mens Health', 'Mental Health'] },
      { name: 'Nurse Emma Collins', role: 'Practice Nurse', color: '#10B981', assigned_services: ['Immunisation', 'Wound Care', 'Blood Pressure Check'] },
      { name: 'Lisa Wong', role: 'Receptionist', color: '#F59E0B', assigned_services: [] },
    ],
    services: [
      { name: 'General Consultation', category: 'Medical', duration_minutes: 15, price: 90, color: '#3B82F6' },
      { name: 'Long Consultation', category: 'Medical', duration_minutes: 30, price: 140, color: '#3B82F6' },
      { name: 'Health Check', category: 'Preventive', duration_minutes: 45, price: 120, color: '#8B5CF6' },
      { name: 'Chronic Disease Management', category: 'Medical', duration_minutes: 40, price: 130, color: '#8B5CF6' },
      { name: 'Immunisation', category: 'Preventive', duration_minutes: 15, price: 40, color: '#10B981' },
      { name: 'Wound Care', category: 'Nursing', duration_minutes: 20, price: 55, color: '#10B981' },
      { name: 'Mental Health Consultation', category: 'Mental Health', duration_minutes: 60, price: 200, color: '#EC4899' },
    ],
    faq: [
      { q: 'Do I need a referral?', a: 'No referral is needed to see a GP. For specialist appointments, a GP referral may be required.' },
      { q: 'Are you bulk-billing?', a: 'We offer bulk-billing for pensioners, children under 16, and healthcare card holders. Standard consultation fees apply for others.' },
      { q: 'How do I get my test results?', a: 'Test results are reviewed by your doctor and you will be contacted if follow-up is required. You can also call reception to ask about results.' },
      { q: 'Can I book a same-day appointment?', a: 'Yes, we keep slots available for urgent same-day bookings. Call us first thing in the morning for best availability.' },
      { q: 'What should I bring to my first appointment?', a: 'Please bring a valid photo ID, Medicare card, and any relevant health records or previous test results.' },
    ],
  },

  restaurant: {
    businessHours: {
      monday:    { open: false, open_time: '17:00', close_time: '22:00' },
      tuesday:   { open: true,  open_time: '11:30', close_time: '22:00' },
      wednesday: { open: true,  open_time: '11:30', close_time: '22:00' },
      thursday:  { open: true,  open_time: '11:30', close_time: '22:00' },
      friday:    { open: true,  open_time: '11:30', close_time: '23:00' },
      saturday:  { open: true,  open_time: '11:00', close_time: '23:00' },
      sunday:    { open: true,  open_time: '11:00', close_time: '21:00' },
    },
    staff: [
      { name: 'Marco Bianchi', role: 'Head Chef', color: '#EF4444', assigned_services: ['Chef\'s Table Experience', 'Private Dining'] },
      { name: 'Tanya Ross', role: 'Floor Manager', color: '#F59E0B', assigned_services: ['Table Reservation', 'Private Events'] },
      { name: 'Daniel Park', role: 'Sommelier', color: '#8B5CF6', assigned_services: ['Wine Pairing', 'Private Dining'] },
      { name: 'Jasmine Lee', role: 'Reservations', color: '#10B981', assigned_services: ['Table Reservation'] },
    ],
    services: [
      { name: 'Table Reservation', category: 'Dining', duration_minutes: 90, price: 0, color: '#F59E0B' },
      { name: 'Private Dining', category: 'Events', duration_minutes: 180, price: 500, color: '#EF4444' },
      { name: 'Chef\'s Table Experience', category: 'Premium', duration_minutes: 150, price: 250, color: '#8B5CF6' },
      { name: 'Wine Pairing Dinner', category: 'Premium', duration_minutes: 120, price: 180, color: '#8B5CF6' },
      { name: 'Function Room Hire', category: 'Events', duration_minutes: 240, price: 800, color: '#3B82F6' },
    ],
    faq: [
      { q: 'How do I make a reservation?', a: 'I can book a table for you right now! Just let me know your preferred date, time, and how many guests.' },
      { q: 'Do you cater for dietary requirements?', a: 'Yes, we accommodate vegetarian, vegan, gluten-free, and most allergies. Please mention requirements when booking.' },
      { q: 'Is there a dress code?', a: 'We have a smart casual dress code. We ask that guests avoid thongs, singlets, and sportswear.' },
      { q: 'Do you take large group bookings?', a: 'Yes, we welcome groups. For parties of 10 or more we recommend booking at least 2 weeks in advance and we offer set menus.' },
      { q: 'What is your cancellation policy?', a: 'We ask for 24 hours notice for cancellations. For groups of 8+, 48 hours notice is required.' },
    ],
  },

  dental: {
    businessHours: {
      monday:    { open: true,  open_time: '08:00', close_time: '17:30' },
      tuesday:   { open: true,  open_time: '08:00', close_time: '17:30' },
      wednesday: { open: true,  open_time: '08:00', close_time: '17:30' },
      thursday:  { open: true,  open_time: '08:00', close_time: '19:00' },
      friday:    { open: true,  open_time: '08:00', close_time: '16:00' },
      saturday:  { open: true,  open_time: '09:00', close_time: '13:00' },
      sunday:    { open: false, open_time: '09:00', close_time: '13:00' },
    },
    staff: [
      { name: 'Dr. Amanda Foster', role: 'Principal Dentist', color: '#3B82F6', assigned_services: ['Dental Check-up', 'Crowns & Bridges', 'Teeth Whitening', 'Implants'] },
      { name: 'Dr. Raj Kumar', role: 'Dentist', color: '#8B5CF6', assigned_services: ['Dental Check-up', 'Fillings', 'Root Canal', 'Extractions'] },
      { name: 'Kate Morrison', role: 'Dental Hygienist', color: '#10B981', assigned_services: ['Scale & Clean', 'Fluoride Treatment'] },
      { name: 'Priya Sharma', role: 'Dental Assistant', color: '#F59E0B', assigned_services: [] },
    ],
    services: [
      { name: 'Dental Check-up', category: 'General', duration_minutes: 45, price: 95, color: '#3B82F6' },
      { name: 'Scale & Clean', category: 'Hygiene', duration_minutes: 60, price: 150, color: '#10B981' },
      { name: 'Fillings', category: 'Restorative', duration_minutes: 60, price: 180, color: '#8B5CF6' },
      { name: 'Teeth Whitening', category: 'Cosmetic', duration_minutes: 90, price: 650, color: '#F59E0B' },
      { name: 'Root Canal', category: 'Restorative', duration_minutes: 90, price: 900, color: '#EF4444' },
      { name: 'Crowns & Bridges', category: 'Restorative', duration_minutes: 60, price: 1400, color: '#EF4444' },
      { name: 'Extractions', category: 'Oral Surgery', duration_minutes: 45, price: 250, color: '#EC4899' },
      { name: 'Fluoride Treatment', category: 'Preventive', duration_minutes: 20, price: 45, color: '#10B981' },
    ],
    faq: [
      { q: 'Do you accept health fund?', a: 'Yes, we are a preferred provider for most major health funds including Medibank, Bupa, and HCF. We offer HICAPS on the spot.' },
      { q: 'How often should I get a check-up?', a: 'We recommend a dental check-up and clean every 6 months to maintain optimal oral health.' },
      { q: 'Do you see children?', a: 'Absolutely! We welcome patients of all ages and have experience making children feel comfortable and at ease.' },
      { q: 'What do I do in a dental emergency?', a: 'Call us as soon as possible. We keep emergency slots available each day for urgent dental pain, broken teeth, or trauma.' },
      { q: 'Is teeth whitening safe?', a: 'Yes, our professional teeth whitening treatments are safe and supervised by a dentist. Results typically last 1-2 years.' },
    ],
  },

  gym: {
    businessHours: {
      monday:    { open: true, open_time: '05:30', close_time: '22:00' },
      tuesday:   { open: true, open_time: '05:30', close_time: '22:00' },
      wednesday: { open: true, open_time: '05:30', close_time: '22:00' },
      thursday:  { open: true, open_time: '05:30', close_time: '22:00' },
      friday:    { open: true, open_time: '05:30', close_time: '21:00' },
      saturday:  { open: true, open_time: '07:00', close_time: '18:00' },
      sunday:    { open: true, open_time: '08:00', close_time: '16:00' },
    },
    staff: [
      { name: 'Liam Carter', role: 'Head Personal Trainer', color: '#EF4444', assigned_services: ['Personal Training', 'Strength & Conditioning'] },
      { name: 'Aisha Okafor', role: 'Group Fitness Instructor', color: '#F59E0B', assigned_services: ['Yoga', 'Pilates', 'HIIT Class'] },
      { name: 'Tom Riley', role: 'Personal Trainer', color: '#3B82F6', assigned_services: ['Personal Training', 'Weight Loss Program'] },
      { name: 'Zoe Adams', role: 'Nutritionist', color: '#10B981', assigned_services: ['Nutrition Consultation', 'Meal Plan'] },
    ],
    services: [
      { name: 'Personal Training', category: 'Training', duration_minutes: 60, price: 90, color: '#EF4444' },
      { name: 'Strength & Conditioning', category: 'Training', duration_minutes: 60, price: 95, color: '#EF4444' },
      { name: 'Weight Loss Program', category: 'Training', duration_minutes: 60, price: 85, color: '#F59E0B' },
      { name: 'Yoga', category: 'Classes', duration_minutes: 60, price: 25, color: '#8B5CF6' },
      { name: 'Pilates', category: 'Classes', duration_minutes: 45, price: 28, color: '#8B5CF6' },
      { name: 'HIIT Class', category: 'Classes', duration_minutes: 45, price: 22, color: '#EF4444' },
      { name: 'Nutrition Consultation', category: 'Wellness', duration_minutes: 60, price: 120, color: '#10B981' },
      { name: 'Gym Membership (Monthly)', category: 'Membership', duration_minutes: 30, price: 60, color: '#3B82F6' },
    ],
    faq: [
      { q: 'Do you offer free trials?', a: 'Yes! We offer a free 7-day trial membership so you can experience the gym before committing. I can set that up for you now.' },
      { q: 'What are your membership options?', a: 'We have casual visits, monthly memberships, and annual plans. Monthly is $60 and annual is $600 saving you $120.' },
      { q: 'Do I need to book classes?', a: 'Yes, all group classes require booking as spots are limited. You can book through me, our app, or at reception.' },
      { q: 'Is there parking available?', a: 'Yes, we have free parking for members in our dedicated car park adjacent to the building.' },
      { q: 'Can I bring a guest?', a: 'Members can bring one guest per visit for a $15 day pass fee. Guests must sign a waiver at reception.' },
    ],
  },

  spa: {
    businessHours: {
      monday:    { open: true, open_time: '09:00', close_time: '19:00' },
      tuesday:   { open: true, open_time: '09:00', close_time: '19:00' },
      wednesday: { open: true, open_time: '09:00', close_time: '19:00' },
      thursday:  { open: true, open_time: '09:00', close_time: '20:00' },
      friday:    { open: true, open_time: '09:00', close_time: '20:00' },
      saturday:  { open: true, open_time: '09:00', close_time: '18:00' },
      sunday:    { open: true, open_time: '10:00', close_time: '17:00' },
    },
    staff: [
      { name: 'Isabelle Renard', role: 'Senior Therapist', color: '#EC4899', assigned_services: ['Hot Stone Massage', 'Deep Tissue Massage', 'Facial'] },
      { name: 'Yuki Tanaka', role: 'Beauty Therapist', color: '#8B5CF6', assigned_services: ['Facial', 'Waxing', 'Body Wrap'] },
      { name: 'Marcus Webb', role: 'Remedial Therapist', color: '#3B82F6', assigned_services: ['Remedial Massage', 'Deep Tissue Massage', 'Lymphatic Drainage'] },
    ],
    services: [
      { name: 'Swedish Massage', category: 'Massage', duration_minutes: 60, price: 110, color: '#EC4899' },
      { name: 'Deep Tissue Massage', category: 'Massage', duration_minutes: 60, price: 130, color: '#EC4899' },
      { name: 'Hot Stone Massage', category: 'Massage', duration_minutes: 90, price: 160, color: '#EF4444' },
      { name: 'Remedial Massage', category: 'Therapeutic', duration_minutes: 60, price: 120, color: '#3B82F6' },
      { name: 'Hydrating Facial', category: 'Facial', duration_minutes: 75, price: 130, color: '#8B5CF6' },
      { name: 'Anti-Aging Facial', category: 'Facial', duration_minutes: 90, price: 180, color: '#8B5CF6' },
      { name: 'Body Wrap', category: 'Body', duration_minutes: 90, price: 150, color: '#10B981' },
      { name: 'Spa Day Package', category: 'Packages', duration_minutes: 240, price: 380, color: '#F59E0B' },
    ],
    faq: [
      { q: 'Should I arrive early for my appointment?', a: 'We recommend arriving 10-15 minutes early to complete any intake forms and begin your relaxation journey.' },
      { q: 'What should I wear?', a: 'We provide towels, robes, and disposable underwear. Simply wear comfortable clothing to arrive in.' },
      { q: 'Can I book for a group or hen party?', a: 'Absolutely! We offer spa packages for groups of 4 or more. Contact us to arrange a custom package.' },
      { q: 'Are your products cruelty-free?', a: 'Yes, all our skincare and treatment products are cruelty-free and ethically sourced.' },
      { q: 'Do you offer gift vouchers?', a: 'Yes, gift vouchers are available for any dollar amount or specific treatment. They make a perfect gift!' },
    ],
  },

  tradie: {
    businessHours: {
      monday:    { open: true, open_time: '07:00', close_time: '17:00' },
      tuesday:   { open: true, open_time: '07:00', close_time: '17:00' },
      wednesday: { open: true, open_time: '07:00', close_time: '17:00' },
      thursday:  { open: true, open_time: '07:00', close_time: '17:00' },
      friday:    { open: true, open_time: '07:00', close_time: '16:00' },
      saturday:  { open: true, open_time: '08:00', close_time: '13:00' },
      sunday:    { open: false, open_time: '09:00', close_time: '12:00' },
    },
    staff: [
      { name: 'Steve Hartley', role: 'Master Electrician', color: '#F59E0B', assigned_services: ['Electrical Inspection', 'Wiring & Rewiring', 'Switchboard Upgrade'] },
      { name: 'Dan O\'Brien', role: 'Plumber', color: '#3B82F6', assigned_services: ['Plumbing Inspection', 'Leak Repair', 'Hot Water System'] },
      { name: 'Chris Malone', role: 'Apprentice', color: '#10B981', assigned_services: ['General Maintenance', 'Fault Finding'] },
    ],
    services: [
      { name: 'Service Call / Quote', category: 'General', duration_minutes: 60, price: 120, color: '#F59E0B' },
      { name: 'Electrical Inspection', category: 'Electrical', duration_minutes: 90, price: 200, color: '#F59E0B' },
      { name: 'Wiring & Rewiring', category: 'Electrical', duration_minutes: 240, price: 600, color: '#F59E0B' },
      { name: 'Switchboard Upgrade', category: 'Electrical', duration_minutes: 180, price: 900, color: '#EF4444' },
      { name: 'Plumbing Inspection', category: 'Plumbing', duration_minutes: 60, price: 150, color: '#3B82F6' },
      { name: 'Leak Repair', category: 'Plumbing', duration_minutes: 120, price: 250, color: '#3B82F6' },
      { name: 'Hot Water System', category: 'Plumbing', duration_minutes: 180, price: 1200, color: '#3B82F6' },
      { name: 'General Maintenance', category: 'General', duration_minutes: 120, price: 200, color: '#10B981' },
    ],
    faq: [
      { q: 'Do you offer free quotes?', a: 'Yes, we provide free on-site quotes for most jobs. I can book a quote appointment at a time that suits you.' },
      { q: 'Are you licensed and insured?', a: 'Absolutely. All our tradespeople are fully licensed, insured, and police-checked for your peace of mind.' },
      { q: 'Do you offer emergency call-outs?', a: 'Yes, we have emergency after-hours services available. Additional fees apply for after-hours call-outs.' },
      { q: 'How long will the job take?', a: 'Job duration varies depending on complexity. We\'ll give you an accurate time estimate when we provide your quote.' },
      { q: 'Do you clean up after the job?', a: 'Yes, our team always tidies up and removes all waste and materials before leaving your property.' },
    ],
  },

  legal: {
    businessHours: {
      monday:    { open: true, open_time: '08:30', close_time: '17:30' },
      tuesday:   { open: true, open_time: '08:30', close_time: '17:30' },
      wednesday: { open: true, open_time: '08:30', close_time: '17:30' },
      thursday:  { open: true, open_time: '08:30', close_time: '17:30' },
      friday:    { open: true, open_time: '08:30', close_time: '17:00' },
      saturday:  { open: false, open_time: '09:00', close_time: '12:00' },
      sunday:    { open: false, open_time: '09:00', close_time: '12:00' },
    },
    staff: [
      { name: 'Rebecca Lawson', role: 'Principal Solicitor', color: '#1E40AF', assigned_services: ['Initial Consultation', 'Contract Review', 'Property Conveyancing'] },
      { name: 'Michael Grant', role: 'Senior Lawyer', color: '#7C3AED', assigned_services: ['Family Law', 'Wills & Estates', 'Initial Consultation'] },
      { name: 'Priya Nair', role: 'Paralegal', color: '#0369A1', assigned_services: ['Document Preparation', 'Administrative'] },
    ],
    services: [
      { name: 'Initial Consultation', category: 'General', duration_minutes: 30, price: 0, color: '#3B82F6' },
      { name: 'Contract Review', category: 'Commercial', duration_minutes: 60, price: 350, color: '#8B5CF6' },
      { name: 'Property Conveyancing', category: 'Property', duration_minutes: 60, price: 1200, color: '#10B981' },
      { name: 'Wills & Estates', category: 'Personal', duration_minutes: 60, price: 400, color: '#F59E0B' },
      { name: 'Family Law Consultation', category: 'Family', duration_minutes: 60, price: 350, color: '#EF4444' },
      { name: 'Business Structuring', category: 'Commercial', duration_minutes: 90, price: 600, color: '#8B5CF6' },
    ],
    faq: [
      { q: 'Is the initial consultation free?', a: 'Yes, we offer a free 30-minute initial consultation so we can understand your situation and advise you on next steps.' },
      { q: 'How quickly can I get an appointment?', a: 'We typically have availability within 2-3 business days for non-urgent matters. Urgent matters can often be seen sooner.' },
      { q: 'Are your fees fixed or hourly?', a: 'We offer both fixed-fee packages for certain services and hourly rates. We\'ll be transparent about costs in your initial consultation.' },
      { q: 'Do you offer video consultations?', a: 'Yes, we offer secure video consultations for clients who cannot come to our office.' },
      { q: 'What documents should I bring?', a: 'This depends on your matter. When booking, our team will advise you what to bring based on your specific needs.' },
    ],
  },

  property: {
    businessHours: {
      monday:    { open: true, open_time: '09:00', close_time: '17:30' },
      tuesday:   { open: true, open_time: '09:00', close_time: '17:30' },
      wednesday: { open: true, open_time: '09:00', close_time: '17:30' },
      thursday:  { open: true, open_time: '09:00', close_time: '17:30' },
      friday:    { open: true, open_time: '09:00', close_time: '17:00' },
      saturday:  { open: true, open_time: '09:00', close_time: '13:00' },
      sunday:    { open: false, open_time: '10:00', close_time: '13:00' },
    },
    staff: [
      { name: 'Nathan Cole', role: 'Principal Agent', color: '#1D4ED8', assigned_services: ['Property Appraisal', 'Sales Consultation', 'Auction'] },
      { name: 'Jessica Hart', role: 'Property Manager', color: '#7C3AED', assigned_services: ['Property Management', 'Routine Inspection', 'Tenant Enquiry'] },
      { name: 'Tyler Brooks', role: 'Sales Agent', color: '#0891B2', assigned_services: ['Property Appraisal', 'Open Home', 'Sales Consultation'] },
    ],
    services: [
      { name: 'Property Appraisal', category: 'Sales', duration_minutes: 60, price: 0, color: '#3B82F6' },
      { name: 'Sales Consultation', category: 'Sales', duration_minutes: 60, price: 0, color: '#3B82F6' },
      { name: 'Open Home Registration', category: 'Sales', duration_minutes: 30, price: 0, color: '#10B981' },
      { name: 'Tenant Enquiry', category: 'Rental', duration_minutes: 30, price: 0, color: '#8B5CF6' },
      { name: 'Routine Inspection', category: 'Rental', duration_minutes: 45, price: 0, color: '#F59E0B' },
      { name: 'Rental Appraisal', category: 'Rental', duration_minutes: 45, price: 0, color: '#8B5CF6' },
    ],
    faq: [
      { q: 'How do I book a property inspection?', a: 'I can register you for an upcoming open home or book a private inspection right now. What property are you interested in?' },
      { q: 'What are your property management fees?', a: 'Our property management fees are competitive. Please request a free rental appraisal and our team will provide a full fee schedule.' },
      { q: 'How long does it take to sell a property?', a: 'Average time on market varies by location and price point. Your agent will give you a realistic expectation at your appraisal.' },
      { q: 'How do I apply for a rental?', a: 'Applications are processed through our online portal. I can send you the link or book a time to chat with our property manager.' },
      { q: 'Do you manage commercial properties?', a: 'Yes, we have a commercial division that manages retail, office, and industrial properties. Ask about our commercial team.' },
    ],
  },

  other: {
    businessHours: {
      monday:    { open: true, open_time: '09:00', close_time: '17:00' },
      tuesday:   { open: true, open_time: '09:00', close_time: '17:00' },
      wednesday: { open: true, open_time: '09:00', close_time: '17:00' },
      thursday:  { open: true, open_time: '09:00', close_time: '17:00' },
      friday:    { open: true, open_time: '09:00', close_time: '17:00' },
      saturday:  { open: false, open_time: '10:00', close_time: '14:00' },
      sunday:    { open: false, open_time: '10:00', close_time: '14:00' },
    },
    staff: [
      { name: 'Alex Johnson', role: 'Manager', color: '#8B5CF6', assigned_services: ['Consultation', 'Premium Service'] },
      { name: 'Sam Taylor', role: 'Specialist', color: '#3B82F6', assigned_services: ['Consultation', 'Standard Service'] },
    ],
    services: [
      { name: 'Consultation', category: 'General', duration_minutes: 30, price: 0, color: '#8B5CF6' },
      { name: 'Standard Service', category: 'General', duration_minutes: 60, price: 100, color: '#3B82F6' },
      { name: 'Premium Service', category: 'General', duration_minutes: 90, price: 200, color: '#F59E0B' },
    ],
    faq: [
      { q: 'How do I make a booking?', a: 'I can book you in right now! Just let me know what service you need and your preferred date and time.' },
      { q: 'What are your payment options?', a: 'We accept cash, card, and bank transfer. Payment is due at the time of service.' },
      { q: 'Do you offer refunds?', a: 'Please speak with our team directly about our refund and cancellation policy for your specific situation.' },
    ],
  },
};

export function getTemplate(industry) {
  return INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES.other;
}
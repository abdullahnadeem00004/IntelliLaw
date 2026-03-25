/**
 * IntelliLaw Constants
 */

export const APP_NAME = 'IntelliLaw';

export const CASE_STATUSES = [
  { label: 'Active', value: 'ACTIVE', color: 'bg-primary-100 text-primary-700' },
  { label: 'Pending', value: 'PENDING', color: 'bg-warning/10 text-warning' },
  { label: 'Closed', value: 'CLOSED', color: 'bg-neutral-100 text-neutral-700' },
  { label: 'Archived', value: 'ARCHIVED', color: 'bg-neutral-100 text-neutral-500' },
];

export const CASE_PRIORITIES = [
  { label: 'Low', value: 'LOW', color: 'bg-neutral-100 text-neutral-700' },
  { label: 'Medium', value: 'MEDIUM', color: 'bg-info/10 text-info' },
  { label: 'High', value: 'HIGH', color: 'bg-warning/10 text-warning' },
  { label: 'Critical', value: 'CRITICAL', color: 'bg-error/10 text-error' },
];

export const DOCUMENT_CATEGORIES = [
  'PLEADINGS',
  'EVIDENCE',
  'ORDERS',
  'CORRESPONDENCE',
  'OTHER',
];

export const PAKISTAN_COURTS = [
  'Supreme Court of Pakistan',
  'Lahore High Court',
  'Sindh High Court',
  'Peshawar High Court',
  'Balochistan High Court',
  'Islamabad High Court',
  'District Court Lahore',
  'District Court Karachi',
  'District Court Islamabad',
  'Specialized Tribunals',
];

export const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Kashmir',
];

export const PAKISTAN_DISTRICTS: Record<string, string[]> = {
  'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang'],
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Thatta', 'Badin', 'Jacobabad', 'Shikarpur'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Kohat', 'Dera Ismail Khan', 'Mansehra', 'Nowshera', 'Charsadda', 'Swabi'],
  'Balochistan': ['Quetta', 'Gwadar', 'Khuzdar', 'Turbat', 'Chaman', 'Sibi', 'Zhob', 'Loralai', 'Nushki', 'Kharan'],
  'Islamabad Capital Territory': ['Islamabad'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Diamer', 'Ghanche', 'Ghizer', 'Astore', 'Kharmang', 'Shigar', 'Nagar'],
  'Azad Kashmir': ['Muzaffarabad', 'Mirpur', 'Kotli', 'Bhimber', 'Rawalakot', 'Bagh', 'Sudhanoti', 'Hattian Bala', 'Haveli', 'Neelum'],
};

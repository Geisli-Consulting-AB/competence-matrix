import jsPDF from 'jspdf';
import type { Metrics } from '../shared';
import { addContact } from './components/contact';
import { addRoles } from './components/roles';
import { addAvatar } from './components/avatar';

// Left column background: #101b29
export function drawSidebar(doc: jsPDF, m: Metrics) {
  doc.setFillColor(16, 27, 41);
  doc.rect(0, 0, m.leftColW, m.pageH, 'F');
}

// Build the left column of page 1
export async function buildLeftColumn(
  doc: jsPDF,
  m: Metrics,
  photoDataUrl: string | undefined,
  roles: string[] | undefined,
  strings: { contactTitle: string; rolesTitle: string },
) {
  drawSidebar(doc, m);
  const startY = await addAvatar(doc, m, photoDataUrl);
  const afterContactY = await addContact(doc, m, startY, { contactTitle: strings.contactTitle });
  if (Array.isArray(roles) && roles.length > 0) {
    await addRoles(doc, m, afterContactY, roles, { rolesTitle: strings.rolesTitle });
  }
}

// Re-export section builders for discoverability
export { addContact } from './components/contact';
export { addRoles } from './components/roles';
export { addAvatar } from './components/avatar';

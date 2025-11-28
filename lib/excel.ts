import * as XLSX from 'xlsx';
import { Campaign, Adgroup } from '@/types';

export function generateExcelFile(campaign: Campaign): Buffer {
  const rows: any[] = [];

  // Add header row
  rows.push([
    'Campaign Name',
    'Adgroup Name',
    'Keyword',
    'Headline 1',
    'Headline 2',
    'Description 1',
    'Description 2',
    'Description 3',
    'Landing Page URL',
  ]);

  // Add data rows
  campaign.adgroups.forEach((adgroup: Adgroup) => {
    adgroup.keywords
      .filter(k => !k.removed)
      .forEach((keyword) => {
        const landingPageUrl = adgroup.landingPageUrls[0] || '';
        rows.push([
          campaign.name,
          adgroup.name,
          keyword.text,
          adgroup.headlines[0] || '',
          adgroup.headlines[1] || '',
          adgroup.descriptions[0] || '',
          adgroup.descriptions[1] || '',
          adgroup.descriptions[2] || '',
          landingPageUrl,
        ]);
      });
  });

  // Create workbook and worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}


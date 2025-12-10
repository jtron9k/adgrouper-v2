import * as XLSX from 'xlsx';
import { Campaign, Adgroup } from '@/types';

export function generateExcelFile(campaign: Campaign): Buffer {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // === Tab 1: Campaign Data ===
  const campaignRows: any[] = [];

  // Add header row
  campaignRows.push([
    'Campaign Name',
    'Adgroup Name',
    'Keyword',
    'Headline 1',
    'Headline 2',
    'Headline 3',
    'Headline 4',
    'Headline 5',
    'Headline 6',
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
        campaignRows.push([
          campaign.name,
          adgroup.name,
          keyword.text,
          adgroup.headlines[0] || '',
          adgroup.headlines[1] || '',
          adgroup.headlines[2] || '',
          adgroup.headlines[3] || '',
          adgroup.headlines[4] || '',
          adgroup.headlines[5] || '',
          adgroup.descriptions[0] || '',
          adgroup.descriptions[1] || '',
          adgroup.descriptions[2] || '',
          landingPageUrl,
        ]);
      });
  });

  const campaignSheet = XLSX.utils.aoa_to_sheet(campaignRows);
  XLSX.utils.book_append_sheet(workbook, campaignSheet, 'Campaign');

  // === Tab 2: Irrelevant Keywords ===
  const irrelevantRows: any[] = [];

  // Add header row
  irrelevantRows.push(['Irrelevant Keywords']);

  // Add irrelevant keywords as single column
  if (campaign.irrelevantKeywords && campaign.irrelevantKeywords.length > 0) {
    campaign.irrelevantKeywords.forEach((keyword) => {
      irrelevantRows.push([keyword]);
    });
  }

  const irrelevantSheet = XLSX.utils.aoa_to_sheet(irrelevantRows);
  XLSX.utils.book_append_sheet(workbook, irrelevantSheet, 'Irrelevant Keywords');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

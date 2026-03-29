export const NAV_ITEMS = [
  { group: 'Overview', items: [
      { id: 'intro', label: 'Introduction', icon: '◈' },
      { id: 'definitions', label: 'Key Definitions', icon: '📖' },
      { id: 'methodology', label: 'Methodology', icon: '📝' },
      { id: 'pipeline', label: 'Pipeline - Workflow', icon: '⚙' },
    ]},
  { group: 'Key Findings', items: [
      { id: 'findings-table', label: 'Key Findings Summary', icon: '📋' },
      { id: 'temporal-lag', label: 'The Temporal Lag', icon: '⌛' },
      { id: 'demographic-gap', label: 'The Demographic Gap', icon: '👥' },
      { id: 'outcome-mismatch', label: 'Outcome-Mortality Mismatch', icon: '⚠️' },
    ]},
  { group: 'Tools', items: [
      { id: 'explorer', label: 'PICO Explorer', icon: '🔬' },
      { id: 'extract-recent', label: 'Extract Recent Abstracts', icon: '📥' },
      { id: 'extract-paper', label: 'Extract Complete Paper', icon: '📄' },
    ]}
];

export const STATS = [
  { label: 'PubMed Abstracts', value: '2,471', sub: 'MASLD/MASH Focused', color: 'primary' },
  { label: 'Clinical Trials', value: '1,372', sub: 'NCT Registered', color: 'primaryLt' },
  { label: 'PICO Extractions', value: '3,843', sub: 'MedGemma 4B', color: 'accent' },
  { label: 'Mortality History', value: '25y', sub: 'CDC WONDER Data', color: 'hcc' },
];

export const KEY_FINDINGS_DATA = [
  { niche: 'Lean MASLD', deaths: 8208, change: '+193.9%', intensity: 160.94, ageBand: '85+' },
  { niche: 'MASH Fibrosis', deaths: 8208, change: '+193.9%', intensity: 81.02, ageBand: '85+' },
  { niche: 'MASLD-HCC', deaths: 61064, change: '+119.4%', intensity: 7.94, ageBand: '85+' },
];

export const DEFINITIONS_DATA = [
  { 
    term: 'Research Intensity (RI)', 
    def: 'A normalized score that measures the volume of scientific attention relative to the actual disease burden.',
    formula: 'RI = (Total Research / CDC Annual Deaths) X 1000',
    explanation: '"Research Intensity tells us if we are \'out-studying\' or \'under-studying\' a disease. For example, a low RI in MASLD-HCC (7.94) suggests that for every 1,000 deaths, we have fewer than 8 major studies, indicating a significant \'Research Desert.\'"'
  },
  { 
    term: 'Hard Endpoint (Mortality)', 
    def: 'A primary outcome in a study that measures a definitive clinical event, such as death (overall survival) or liver transplant.',
    explanation: '"This is the \'gold standard\' for clinical relevance. It measures whether a treatment actually keeps a patient alive, rather than just changing a lab value."'
  },
  { 
    term: 'Surrogate Endpoint', 
    def: 'A laboratory measurement or physical sign (like liver fat percentage or a fibrosis score) used as a substitute for a hard clinical endpoint.',
    explanation: '"Surrogates are \'proxies.\' While they make trials faster and cheaper, they don\'t always guarantee that a patient will live longer. Our data shows that 50.5% of MASH research focuses on these proxies instead of survival."'
  },
  { 
    term: 'Coverage Gap / Worst Ageband Coverage', 
    def: 'The discrepancy between the age group suffering the most deaths (from CDC data) and the age group being recruited for trials (from PICO extraction).',
    explanation: '"This measures Health Equity. If the 85+ age group has the highest mortality but is excluded from 70% of trials, we have a \'Coverage Gap.\' This means our clinical guidelines are being written for patients who aren\'t the ones actually dying from the disease."'
  },
  { 
    term: 'Evidence Count (N >= 5)', 
    def: 'The total number of unique research records (PubMed or ClinicalTrials.gov) identified for a specific niche.',
    explanation: '"The \'N\' represents our sample size of knowledge. We apply a filter of N >= 5 to ensure that our conclusions about research focus (like % mortality) are based on a representative body of work, not just one or two outlier papers."'
  },
  { 
    term: 'Temporal Lag', 
    def: 'The time delay (usually measured in years) between a spike in real-world mortality and the subsequent increase in clinical trial initiations.',
    explanation: '"Our analysis found a multi-year (13 -16) lag. This proves that the research ecosystem is currently reactive responding to yesterday\'s mortality spikes rather than predicting tomorrow’s needs."'
  },
  { 
    term: 'PICO Extraction (AI-Assisted)', 
    def: 'A framework for evidence-based medicine that stands for Population, Intervention, Comparison, and Outcome.',
    explanation: '"Using MedGemma, we performed Zero-Shot (without providing examples to LLM) PICO Extraction. This allowed the AI to \'read\' thousands of abstracts and instantly categorize who was being studied (P) and what goals were being measured (O) without manual human bias."'
  }
];

export const CDC_DATA = [
  { year: '1999', deaths: 5210, rate: 1.8 },
  { year: '2010', deaths: 7450, rate: 2.4 },
  { year: '2023', deaths: 14200, rate: 4.2 },
];

import React from 'react';
import { Card, Badge } from './Cards';
import { T } from '../theme/tokens';

export default function MethodologyPage() {
  const MESH_CRITERIA = {
    Lean_MASLD: `
        (
            "Non-alcoholic Fatty Liver Disease"[MeSH]
            OR MASLD[tiab]
            OR "lean NAFLD"[tiab]
            OR "non-obese NAFLD"[tiab]
            OR "lean MASLD"[tiab]
        )
        AND
        (
            "normal weight"[tiab]
            OR "non-obese"[tiab]
            OR "lean"[tiab]
            OR "Body Mass Index"[MeSH]
            OR BMI[tiab]
        )
        AND
        (
            "Mortality"[MeSH]
            OR "mortality"[subheading]
            OR "Incidence"[MeSH]
            OR "epidemiology"[subheading]
            OR "survival"[tiab]
            OR "prognosis"[MeSH]
            OR "disease progression"[MeSH]
            OR "liver-related"[tiab]
            OR "cardiovascular"[tiab]
            OR "fibrosis"[tiab]
            OR "clinical outcome"[tiab]
            OR "cohort"[tiab]
        )
        AND "adult"[MeSH]
        AND English[lang]
        AND "humans"[MeSH]
    `,
    MASH_Fibrosis: `
        (
            "Non-alcoholic Fatty Liver Disease"[MeSH]
            OR MASH[tiab]
            OR NASH[tiab]
            OR "metabolic steatohepatitis"[tiab]
            OR "metabolic associated steatohepatitis"[tiab]
        )
        AND
        (
            "Liver Cirrhosis"[MeSH]
            OR "liver fibrosis"[tiab]
            OR "hepatic fibrosis"[tiab]
            OR "fibrosis stage"[tiab]
            OR "fibrosis regression"[tiab]
            OR "NASH resolution"[tiab]
            OR "fibrosis progression"[tiab]
            OR Resmetirom[tiab]
            OR semaglutide[tiab]
            OR lanifibranor[tiab]
            OR obeticholic[tiab]
            OR tirzepatide[tiab]
            OR aramchol[tiab]
            OR efruxifermin[tiab]
            OR "drug therapy"[subheading]
            OR "treatment outcome"[MeSH]
        )
        AND
        (
            "Clinical Trial"[pt]
            OR "Randomized Controlled Trial"[pt]
            OR "Controlled Clinical Trial"[pt]
            OR "Meta-Analysis"[pt]
            OR "Observational Study"[pt]
        )
        AND "adult"[MeSH]
        AND English[lang]
        AND "humans"[MeSH]
    `,
    MASLD_HCC: `
        (
            "Non-alcoholic Fatty Liver Disease"[MeSH]
            OR MASLD[tiab]
            OR NAFLD[tiab]
            OR "metabolic dysfunction-associated"[tiab]
            OR "metabolic syndrome"[tiab]
        )
        AND
        (
            "Carcinoma, Hepatocellular"[MeSH]
            OR "hepatocellular carcinoma"[tiab]
            OR HCC[tiab]
            OR "intrahepatic cholangiocarcinoma"[tiab]
            OR "Liver Neoplasms"[MeSH]
            OR "liver cancer"[tiab]
        )
        AND
        (
            "Mortality"[MeSH]
            OR "mortality"[subheading]
            OR "Incidence"[MeSH]
            OR "survival"[subheading]
            OR "prognosis"[MeSH]
            OR "overall survival"[tiab]
            OR "hazard ratio"[tiab]
            OR "risk factor"[tiab]
            OR "etiology"[MeSH]
            OR "cohort"[tiab]
        )
        AND "adult"[MeSH]
        AND English[lang]
        AND "humans"[MeSH]
    `,
    Exclusions: [
      "Editorial[pt]", "Letter[pt]", "Comment[pt]", '"Case Reports"[pt]',
      '"animals"[MeSH:noexp]', '"In Vitro Techniques"[MeSH]',
      '"child"[MeSH:noexp]', '"adolescent"[MeSH]', '"infant"[MeSH]'
    ]
  };

  const CT_CRITERIA = {
    niches: {
      "Lean_MASLD": "Non-alcoholic fatty liver disease",
      "MASH_Fibrosis": "NASH",
      "MASLD_HCC": "Hepatocellular carcinoma"
    },
    params: {
      "query.cond": "Selected Niche Condition",
      "filter.overallStatus": "RECRUITING, ACTIVE_NOT_RECRUITING, COMPLETED",
      "pageSize": "100"
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto p-12 pb-32">
      <header className="border-b border-slate-100 pb-10">
        <Badge variant="primary">CRITICAL METHODOLOGY</Badge>
        <h2 className="font-serif font-black text-[#1E3A8A] mt-6 mb-4 leading-tight" style={{ fontSize: T.h1 }}>
           Data Extraction Criteria
        </h2>
        <p className="text-slate-600 max-w-4xl text-lg font-medium leading-relaxed">
          High-fidelity systematic mapping protocol for GI Research. Defining the technical anchors across PubMed, ClinicalTrials.gov, and CDC WONDER.
        </p>
      </header>

      {/* --- PUBMED MESH SECTION --- */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-900/10">🕮</div>
           <div>
              <h3 className="text-xl font-black text-[#1E3A8A] tracking-widest uppercase">PubMed MeSH Criteria</h3>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Medical Subject Headings: Standardized Bio-Medical Ontology</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {Object.entries(MESH_CRITERIA).map(([key, value]) => (
            key !== 'Exclusions' && (
              <Card key={key} className="p-8 border border-slate-100 bg-white hover:border-blue-400 transition-all shadow-sm">
                <Badge variant="primary" className="mb-4">{key.replace('_', ' ')}</Badge>
                <div className="p-4 bg-slate-900 text-blue-100 rounded-xl font-mono text-[11px] h-96 overflow-y-auto leading-relaxed border-2 border-slate-800 shadow-inner">
                   {value}
                </div>
              </Card>
            )
          ))}
        </div>

        <Card className="p-8 border-rose-100 bg-rose-50/30">
           <h4 className="text-xs font-black uppercase tracking-widest text-rose-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Study Type Exclusions (Always Filtered)
           </h4>
           <div className="flex flex-wrap gap-3">
              {MESH_CRITERIA.Exclusions.map(ex => (
                <span key={ex} className="px-4 py-2 bg-white border border-rose-200 text-rose-700 text-[10px] font-black rounded-xl uppercase shadow-sm">{ex}</span>
              ))}
           </div>
        </Card>
      </section>

      {/* --- CLINICAL TRIALS SECTION --- */}
      <section className="space-y-8 pt-10 border-t border-slate-100">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-900/10">⌬</div>
           <div>
              <h3 className="text-xl font-black text-emerald-900 tracking-widest uppercase">ClinicalTrials.gov V2 API v2</h3>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Interventional Trial Logic</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="p-8 border-emerald-100 bg-white">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Niche Condition Mapping</h4>
              <div className="space-y-4">
                 {Object.entries(CT_CRITERIA.niches).map(([k, v]) => (
                   <div key={k} className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{k}</span>
                      <span className="text-xs font-bold text-emerald-700">{v}</span>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="p-8 border-emerald-100 bg-slate-900 text-white">
              <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-6 tracking-widest">Request Parameters</h4>
              <pre className="text-[11px] font-mono leading-loose text-emerald-100/70">
{JSON.stringify(CT_CRITERIA.params, null, 2)}
              </pre>
           </Card>
        </div>
      </section>

      {/* --- CDC WONDER SECTION --- */}
      <section className="space-y-8 pt-10 border-t border-slate-100">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-xl shadow-lg shadow-amber-900/10">◎</div>
           <div>
              <h3 className="text-xl font-black text-amber-900 tracking-widest uppercase">CDC WONDER Mortality Datasets</h3>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Epidemiological Ground Truth</p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
           <Card className="p-10 border-amber-200 bg-amber-50/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest">UCD 1999–2020 Portal</h4>
                    <div className="p-6 bg-white border border-amber-100 rounded-3xl shadow-sm space-y-4 font-medium text-xs text-slate-600 leading-relaxed">
                       <p><strong className="text-amber-800">Dataset:</strong> Underlying Cause of Death, 1999–2020</p>
                       <p><strong className="text-amber-800">ICD-10 Logic:</strong> Liver Cancer (C22), Fatty Liver (K76.0), Inflammatory (K75)</p>
                       <p><strong className="text-amber-800">GroupBy:</strong> Year; ICD-10 113 Cause List; Ten-Year Age Groups</p>
                       <p><strong className="text-amber-800">Calculations:</strong> Rates Per 100,000 using intercensal populations.</p>
                       <a href="http://wonder.cdc.gov/wonder/help/ucd.html" className="text-blue-600 font-black hover:underline mt-4 block uppercase text-[10px] tracking-widest">Help File →</a>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest">UCD 2018–2024 (Expanded) Portal</h4>
                    <div className="p-6 bg-slate-900 border-none rounded-3xl shadow-xl space-y-4 font-medium text-xs text-slate-300 leading-relaxed">
                       <p><strong className="text-amber-400">Dataset:</strong> Underlying Cause of Death, 2018-2024, Single Race</p>
                       <p><strong className="text-amber-400">ICD-10 Logic:</strong> Expanded liver spectrum including Cholangiocarcinoma (C22.1).</p>
                       <p><strong className="text-amber-400">GroupBy:</strong> Year; ICD-10 113 Cause List; Ten-Year Age Groups</p>
                       <p><strong className="text-amber-400">Status:</strong> Provisional (2023–24) data included for trend projection.</p>
                       <a href="http://wonder.cdc.gov/wonder/help/ucd-expanded.html" className="text-amber-400 font-black hover:underline mt-4 block uppercase text-[10px] tracking-widest">Help File →</a>
                    </div>
                 </div>
              </div>

              <div className="mt-12 p-8 bg-white border-2 border-slate-100 rounded-[32px] shadow-inner">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest text-center">Standardized ICD-10 Code Block</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {["C22.0 to C22.9", "K75.0 to K75.9", "K76.0 to K76.9"].map(range => (
                      <div key={range} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                         <span className="text-xs font-black text-slate-700">{range}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 p-4 bg-blue-900 rounded-2xl border-none">
                       <div className="w-2 h-2 rounded-full bg-blue-300 shadow-sm" />
                       <span className="text-xs font-black text-white">Full GI Series</span>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </section>
    </div>
  );
}

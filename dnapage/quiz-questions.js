// ═══════════════════════════════════════════════════════════════
//  QUIZ QUESTIONS — NeuroArt Research Lab
//  Clinical Neuroscience · DNA Viewer Edition
//
//  NOTE: dna.js inlines these questions directly and does NOT
//  import from this file at runtime. This file is a clean
//  standalone reference. To add questions, mirror them in the
//  QUIZ_QUESTIONS array inside dna.js as well.
// ═══════════════════════════════════════════════════════════════

export const DIFFICULTY_COLORS = {
  easy: { color: '#3dffa0', label: 'Easy' },
  medium: { color: '#ffd166', label: 'Medium' },
  hard: { color: '#ff6b6b', label: 'Hard' },
};

export const QUIZ_CATEGORIES = [
  'All',
  'DNA Structure',
  'Epigenetics',
  'Neurogenetics',
  'DNA Damage',
  'Gene Therapy',
  'Neuro-Oncology',
  'Mitochondrial DNA',
  'Conceptual',
];

export const QUIZ_QUESTIONS = [
  {
    id: 'q01', category: 'DNA Structure', difficulty: 'easy',
    question: 'B-form DNA — the structure shown in this viewer (1BNA) — has approximately how many base pairs per helical turn?',
    options: ['5', '10', '15', '20'], answer: 1,
    explanation: 'B-DNA completes one full helical turn every ~10.5 base pairs, rising ~3.4 Å per base pair for a pitch of ~35 Å. This is the predominant form in neurons under physiological conditions.'
  },
  {
    id: 'q02', category: 'DNA Structure', difficulty: 'easy',
    question: "Which rule states that in double-stranded DNA, [A]=[T] and [G]=[C], making complementary strand prediction possible?",
    options: ["Chargaff's Rules", "Mendel's Law", "Avery's Principle", "Hardy-Weinberg Law"], answer: 0,
    explanation: "Chargaff's Rules state that [A]=[T] and [G]=[C] in any double-stranded DNA. This complementarity is essential for faithful DNA replication in every neuron and glial cell."
  },
  {
    id: 'q03', category: 'DNA Structure', difficulty: 'medium',
    question: 'The "spine of hydration" — ordered water molecules in the 1BNA minor groove — is critical for which neurologically relevant process?',
    options: ['Action potential propagation', 'Protein–DNA recognition by transcription factors', 'Myelin sheath formation', 'Neurotransmitter reuptake'], answer: 1,
    explanation: 'The minor-groove water spine (Drew & Dickerson, 1981) shapes the electrostatic landscape that transcription factors "read." In neurons, this influences how factors like CREB bind promoters of plasticity genes such as BDNF.'
  },
  {
    id: 'q04', category: 'DNA Structure', difficulty: 'hard',
    question: "A high GC content in the APOE promoter (a major Alzheimer's risk locus) implies what about its regulation?",
    options: ['It is constitutively silenced', 'It is susceptible to CpG methylation-based epigenetic regulation', 'It cannot be bound by RNA polymerase', 'It replicates faster than AT-rich regions'], answer: 1,
    explanation: "CpG islands in GC-rich promoters are frequent targets of DNA methyltransferases. Methylation of the APOE promoter modulates its expression; hypermethylation patterns have been linked to late-onset Alzheimer's disease risk."
  },
  {
    id: 'q05', category: 'Epigenetics', difficulty: 'medium',
    question: 'Which epigenetic mark involves addition of a methyl group directly to cytosine in DNA, and is dysregulated in multiple neurological disorders?',
    options: ['Histone acetylation', 'DNA methylation', 'RNA splicing', 'Ubiquitination'], answer: 1,
    explanation: 'DNA methylation at CpG dinucleotides — catalyzed by DNMT enzymes — silences gene expression. Aberrant methylation patterns are implicated in Rett syndrome, Fragile X syndrome, and schizophrenia.'
  },
  {
    id: 'q06', category: 'Epigenetics', difficulty: 'medium',
    question: 'Rett syndrome, a severe neurodevelopmental disorder, is caused by mutations in which methyl-CpG binding protein gene?',
    options: ['MECP2', 'FMRP', 'HTT', 'PARK2'], answer: 0,
    explanation: 'MeCP2 (methyl-CpG binding protein 2) binds methylated cytosines in neuronal DNA to regulate gene expression. Loss-of-function mutations in MECP2 on the X chromosome cause Rett syndrome, featuring regression of motor and communication skills.'
  },
  {
    id: 'q07', category: 'Epigenetics', difficulty: 'hard',
    question: "Activity-dependent demethylation of which gene's promoter is associated with long-term potentiation (LTP) and memory?",
    options: ['APOE', 'BDNF', 'MAOA', 'APP'], answer: 1,
    explanation: 'Neuronal activity drives active demethylation of CpG sites in the BDNF promoter (especially exon IV), upregulating BDNF expression. This epigenetic switch underlies hippocampal LTP and memory consolidation (Martinowich et al., 2003).'
  },
  {
    id: 'q08', category: 'Neurogenetics', difficulty: 'easy',
    question: "Huntington's disease is caused by an expansion of which trinucleotide repeat in the HTT gene?",
    options: ['CGG', 'GAA', 'CAG', 'CTG'], answer: 2,
    explanation: 'A CAG repeat expansion (>36 repeats) in exon 1 of HTT encodes an abnormally long polyglutamine tract in huntingtin protein, causing progressive striatal and cortical neurodegeneration.'
  },
  {
    id: 'q09', category: 'Neurogenetics', difficulty: 'medium',
    question: 'Fragile X syndrome, the most common inherited cause of intellectual disability, results from silencing of which gene after CGG repeat expansion?',
    options: ['MECP2', 'FMR1', 'TSC1', 'NF1'], answer: 1,
    explanation: "Expansion of the CGG repeat in the 5' UTR of FMR1 beyond ~200 copies triggers dense CpG methylation, silencing FMRP production. Its loss leads to excessive, immature dendritic spines and cognitive impairment."
  },
  {
    id: 'q10', category: 'Neurogenetics', difficulty: 'medium',
    question: "The LRRK2 G2019S point mutation is the most common genetic cause of which movement disorder?",
    options: ["Huntington's disease", "ALS", "Parkinson's disease", "Multiple sclerosis"], answer: 2,
    explanation: "The G2019S missense mutation in LRRK2 increases kinase activity and accounts for ~1-2% of sporadic and ~5-6% of familial Parkinson's disease cases, causing degeneration of dopaminergic neurons in the substantia nigra."
  },
  {
    id: 'q11', category: 'Neurogenetics', difficulty: 'hard',
    question: 'C9orf72 GGGGCC repeat expansions are the most common genetic cause of which two neurodegenerative diseases?',
    options: ["Alzheimer's and Parkinson's", "ALS and frontotemporal dementia (FTD)", "Huntington's and spinocerebellar ataxia", "Multiple sclerosis and Guillain-Barre"], answer: 1,
    explanation: 'Pathological GGGGCC expansions in C9orf72 cause ~40% of familial ALS and ~25% of familial FTD. The expanded repeats form G-quadruplex structures, sequestering RNA-binding proteins and producing toxic dipeptide repeat proteins via RAN translation.'
  },
  {
    id: 'q12', category: 'DNA Damage', difficulty: 'medium',
    question: "Which oxidative DNA lesion is most strongly linked to neurodegeneration and found elevated in Alzheimer's and Parkinson's brains?",
    options: ['Double-strand breaks from ionizing radiation', '8-oxoguanine (8-oxodG) from reactive oxygen species', 'UV-induced pyrimidine dimers', 'Alkylation of adenine'], answer: 1,
    explanation: "8-oxodG is a predominant oxidative DNA lesion found in Alzheimer's and Parkinson's brains. It causes G->T transversions if unrepaired and activates base excision repair (BER), whose age-related decline contributes to neuronal loss."
  },
  {
    id: 'q13', category: 'DNA Damage', difficulty: 'hard',
    question: 'Ataxia-telangiectasia (AT) causes cerebellar neurodegeneration because ATM kinase is critical for repairing which DNA lesion in neurons?',
    options: ['Oxidized bases via base excision repair', 'Double-strand DNA breaks (DSBs)', 'Ribonucleotide incorporation', 'Methylation via TET enzymes'], answer: 1,
    explanation: 'ATM is the master kinase of the double-strand break (DSB) response. Neurons experience DSBs from transcription-associated torsional stress; without ATM, cerebellar Purkinje cells and granule neurons undergo apoptosis.'
  },
  {
    id: 'q14', category: 'Gene Therapy', difficulty: 'medium',
    question: 'The first FDA-approved CNS gene therapy (2019) targeted which condition by delivering a functional SMN1 gene via AAV9?',
    options: ['Duchenne muscular dystrophy', 'Spinal muscular atrophy (SMA)', 'ALS', 'Rett syndrome'], answer: 1,
    explanation: 'Onasemnogene abeparvovec (Zolgensma) delivers a functional copy of SMN1 into motor neurons via AAV9. SMN1 mutations cause SMA by depleting survival motor neuron (SMN) protein. A single intravenous infusion achieves durable CNS transgene expression.'
  },
  {
    id: 'q15', category: 'Gene Therapy', difficulty: 'hard',
    question: 'CRISPR-Cas9 uses the same Watson-Crick base pairing seen in this viewer. What must the Cas9 complex unwind to allow guide RNA strand invasion?',
    options: ['The phosphodiester backbone', 'Major and minor groove geometry', 'The double helix — hydrogen bonds between strands must be broken', 'The deoxyribose sugar conformation'], answer: 2,
    explanation: 'Cas9 uses its HNH and RuvC domains to unwind the double helix, breaking the Watson-Crick H-bonds so the gRNA can form an R-loop. This directly depends on the same A-T (2 H-bond) and G-C (3 H-bond) pairing visible in 1BNA.'
  },
  {
    id: 'q16', category: 'Neuro-Oncology', difficulty: 'medium',
    question: 'Mutant IDH1/IDH2 produces 2-hydroxyglutarate (2-HG), which inhibits TET enzymes in gliomas. What is the direct effect on DNA?',
    options: ['Increased DNA strand breaks', 'Hypermethylation of CpG islands (CIMP phenotype)', 'Loss of H3K27 methylation', 'Reduced nucleotide excision repair'], answer: 1,
    explanation: '2-HG competitively inhibits TET2, which normally catalyzes 5-methylcytosine oxidation. TET inhibition causes global CpG hypermethylation (CIMP), silencing tumor-suppressor genes and defining a glioma subtype with better prognosis.'
  },
  {
    id: 'q17', category: 'Neuro-Oncology', difficulty: 'hard',
    question: 'MGMT promoter methylation is used clinically as a predictive biomarker in glioblastoma. What does it predict?',
    options: ['Resistance to bevacizumab', 'Better response to temozolomide (alkylating chemotherapy)', 'Higher likelihood of IDH mutation', 'Faster tumor growth'], answer: 1,
    explanation: 'MGMT encodes a DNA repair enzyme that removes alkyl groups from O6-guanine, reversing temozolomide (TMZ) damage. Methylation silences MGMT, leaving tumor cells unable to fix TMZ-induced adducts — predicting ~50% improved survival with TMZ/radiation in GBM.'
  },
  {
    id: 'q18', category: 'Mitochondrial DNA', difficulty: 'medium',
    question: 'MELAS syndrome is most commonly caused by a point mutation in which mtDNA gene?',
    options: ['MT-CO1 (cytochrome c oxidase)', 'MT-TL1 (tRNA-Leu)', 'MT-ND4 (NADH dehydrogenase)', 'MT-CYB (cytochrome b)'], answer: 1,
    explanation: 'The m.3243A>G mutation in MT-TL1 accounts for ~80% of MELAS cases. It impairs mitochondrial protein synthesis, disrupting oxidative phosphorylation in neurons and causing stroke-like episodes, seizures, and progressive encephalopathy.'
  },
  {
    id: 'q19', category: 'Conceptual', difficulty: 'easy',
    question: 'If you fully stretched out the DNA from a single human neuron, approximately how long would it be?',
    options: ['1 millimeter', '2 meters', '20 meters', '2 kilometers'], answer: 1,
    explanation: 'Each human cell contains ~6 billion base pairs, totaling roughly 2 meters of DNA when fully extended. In neurons, this 2-meter molecule is compacted into a nucleus ~6 um wide — a packing ratio of over 10,000:1 via histone wrapping and chromatin folding.'
  },
  {
    id: 'q20', category: 'Conceptual', difficulty: 'medium',
    question: 'The human brain contains ~86 billion neurons. If somatic mutation rates are ~1 mutation/neuron/year, how many new DNA mutations accumulate across the brain per year?',
    options: ['~86,000', '~86 million', '~86 billion', '~86 trillion'], answer: 2,
    explanation: '~1 somatic mutation per neuron per year x 86 billion neurons = ~86 billion new mutations per year. These somatic mosaicisms contribute to focal epilepsy, autism, and brain tumors — undetectable by standard germline sequencing.'
  },
];

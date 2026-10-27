// Build the Data Understanding (EDA) section — v2 with deduplicated numbers
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const fs = require('fs');

const BODY_FONT = 'Calibri';
const BODY_SIZE = 22; // 11pt

const t = (text, opts = {}) =>
  new TextRun({ text, font: BODY_FONT, size: BODY_SIZE, ...opts });

const para = (content, spacing = { after: 160, line: 300 }) => {
  const runs = Array.isArray(content) ? content : [t(content)];
  return new Paragraph({
    spacing,
    alignment: AlignmentType.LEFT,
    children: runs,
  });
};

const identity = (text) =>
  new Paragraph({
    spacing: { after: 0, line: 260 },
    alignment: AlignmentType.LEFT,
    children: [t(text)],
  });

const label = (text, size = 23) =>
  new Paragraph({
    spacing: { before: 220, after: 80, line: 300 },
    alignment: AlignmentType.LEFT,
    children: [t(text, { bold: true, size })],
  });

const sectionTitle = (text) =>
  new Paragraph({
    spacing: { before: 240, after: 160, line: 300 },
    alignment: AlignmentType.LEFT,
    children: [t(text, { bold: true, size: 26 })],
  });

const children = [];

children.push(identity('Project Team 5'));
children.push(identity('Daniel Oni (SMU ID: 50377321), Safia Khan'));
children.push(identity('CS 7331 - Data Mining'));
children.push(identity('Final Report — Section 2 Draft'));

children.push(sectionTitle('Section 2. Data Understanding'));

// Dataset Overview
children.push(label('Dataset Overview'));
children.push(
  para(
    'We obtained the UCI Phishing Websites Dataset through the ucimlrepo Python package (id = 327), which returned 11,055 labeled URL records across 30 input features and one binary class label. A copy of the raw CSV is saved to the project’s shared data folder so both team members work from an identical snapshot. The dataset is distributed under the Creative Commons Attribution 4.0 license and was donated to UCI by Mohammad and McCluskey [1, 2].'
  )
);
children.push(
  para(
    'All features are categorical and integer-encoded, which matters for later model-choice decisions: 21 features are binary coded as {−1, 1}, 8 features are three-level coded as {−1, 0, 1}, and one feature (redirect) is binary coded as {0, 1}. The convention throughout is that −1 indicates a phishing-like value, 0 indicates a suspicious or ambiguous value, and 1 indicates a legitimate-looking value. We verified at load time that there are 0 missing values across all 31 columns, so no imputation step is required.'
  )
);

// Data Quality (NEW)
children.push(label('Data Quality'));
children.push(
  para(
    'Beyond the no-missing-values check, we audited the dataset for row-level duplication because duplicate records would otherwise leak between the training and test splits and inflate reported performance. The audit found 5,206 exact row duplicates and 5,270 duplicates when considering features only (ignoring the label). The difference means 64 pairs of records have identical feature vectors but opposing labels, representing genuine ambiguity in the labeling process (for example, URLs whose features sit on the boundary between the two classes). We keep these conflicting rows because they reflect a real property of the labeling task; we remove only the 5,206 exact duplicates.'
  )
);
children.push(
  para(
    'After deduplication the dataset contains 5,849 unique records — approximately half the original size. To our knowledge the published literature on this benchmark does not consistently report this duplication (Mohammad, Thabtah, and McCluskey [2]; Almujahid, Haq, and Alshehri [5]; Chiew et al. [10] all evaluate on the full 11,055 records without flagging the duplication issue), so any accuracy comparison between our deduplicated results and theirs understates our effective performance. All subsequent EDA, preprocessing, modeling, and evaluation steps are performed on the 5,849-record deduplicated set.'
  )
);

// Class Distribution
children.push(label('Class Distribution'));
children.push(
  para(
    'Of the 5,849 unique records, 3,019 (51.6%) are labeled phishing and 2,830 (48.4%) are labeled legitimate (Figure 1). The class ratio shifted from the original dataset (55.7% legitimate / 44.3% phishing) because the 5,206 removed duplicates were disproportionately in the legitimate class, which is itself a methodological observation worth noting — any model trained on the raw dataset is implicitly fit to a legitimacy-biased distribution. On the deduplicated data the classes are essentially balanced, so accuracy becomes a reasonable headline metric when reported alongside precision, recall, and F1. We preserve the ratio using a stratified 80/20 train/test split (4,679 training records, 1,170 test records). As a secondary preprocessing variant we apply SMOTEN oversampling to the training set only, following Prof. Luo’s proposal feedback, to compare the SMOTE-balanced training variant against the stratified-only baseline.'
  )
);

// Feature Characteristics
children.push(label('Feature Characteristics'));
children.push(
  para(
    'The 30 features fall into four thematic groups that reflect where the detector would look in a real deployment: URL characteristics observable before loading the page (for example url_length, having_ip_address, having_at_symbol, having_sub_domain, shortining_service), page behavior and abnormal request patterns (for example request_url, url_of_anchor, links_in_tags, sfh, abnormal_url), HTML and JavaScript indicators (for example iframe, popupwindow, rightclick, on_mouseover, redirect), and domain and third-party reputation signals (for example age_of_domain, dnsrecord, web_traffic, page_rank, google_index).'
  )
);
children.push(
  para(
    'Because every feature is already a coded indicator rather than a raw numerical measurement — URL length is recorded as short, medium, or long rather than as a character count — feature scaling will have limited effect on distance-based models. More consequential for model choice: this coding is a poor fit for Gaussian Naive Bayes, which assumes continuous features, so we additionally test a Categorical Naive Bayes variant that matches the data’s actual encoding. The same reasoning drove the choice of SMOTEN (categorical SMOTE) over the standard SMOTE for the oversampling variant, since standard SMOTE would produce interpolated values outside the coded {−1, 0, 1} set.'
  )
);

// Univariate Distributions by Class
children.push(label('Univariate Distributions by Class'));
children.push(
  para(
    'We computed per-feature value distributions split by class on the deduplicated data, using each column’s own available observations rather than complete-case filtering. Figure 2 presents histograms of all 30 features overlaid by class, and the full table of per-value proportions by class is saved as feature_summary_by_class.csv in the shared data folder.'
  )
);
children.push(
  para(
    'Three features show very strong class separation. SSL/HTTPS state (sslfinal_state) is coded −1 for 61.7% of phishing records compared to only 9.3% of legitimate records; conversely 90.4% of legitimate records are coded 1 versus only 14.6% of phishing records. The hyphenated-domain indicator (prefix_suffix) is the most consistently phishing-indicative single feature in the dataset: 100% of phishing records are coded −1 compared to 75.2% of legitimate records. The anchor-URL indicator (url_of_anchor) is coded −1 for 65.7% of phishing records compared to only 0.7% of legitimate records.'
  )
);
children.push(
  para(
    'Features with moderate separation include web_traffic, having_sub_domain, request_url, links_in_tags, and sfh. Three features that our proposal predicted would be strong predictors show a mixed picture when checked against the data: HTTPS presence (sslfinal_state) is in fact among the top signals and confirms that part of our hypothesis, but age_of_domain separates only modestly (phishing 52.0% versus legitimate 45.7% at −1), and url_length shows almost no separation (phishing 82.0% versus legitimate 77.8% at −1). Several features show near-identical distributions across the two classes and are unlikely to contribute meaningful predictive power: favicon, popupwindow, iframe, rightclick, and submitting_to_email each differ by less than two percentage points between phishing and legitimate records. This finding partially revises the feature ranking proposed in the project proposal, and we carry the revised ranking into the Results and Discussion sections.'
  )
);

// Correlation Structure
children.push(label('Correlation Structure'));
children.push(
  para(
    'We computed the full Pearson correlation matrix across all 30 numeric features on the deduplicated data rather than selecting a hand-picked subset, so any feature-feature redundancy visible in the data is reflected in the analysis (Figure 3). The matrix is used to flag highly collinear feature pairs that may distort coefficient-based interpretations in margin-based models and to detect clusters of features that measure overlapping concepts. Notable clusters correspond to the four thematic groups described above, with the strongest within-group correlations appearing among the domain-reputation features (age_of_domain, dnsrecord, web_traffic, page_rank, google_index), which is expected since these all measure variants of domain legitimacy drawn from third-party services.'
  )
);

// Implications
children.push(label('Implications for Preprocessing and Modeling'));
children.push(
  para(
    'Four decisions follow directly from the EDA. First, deduplication must happen before the train/test split, which is implemented as the first preprocessing step. Second, the uniform integer encoding and absence of missing values mean the remaining preprocessing is minimal: a stratified 80/20 train/test split, scaling applied inside the kNN and SVM pipelines rather than globally, and SMOTEN oversampling of the training set as a secondary variant to compare against the stratified-only baseline. Third, the categorical nature of the features justifies testing a Categorical Naive Bayes model in addition to the Gaussian variant more commonly reported in prior work on this dataset. Fourth, the observation that roughly five to six features carry the bulk of the class-separating signal, with another five to eight carrying moderate signal and the remainder contributing almost nothing, supports the viability of our secondary hypothesis that a URL-only feature subset — dropping the five features that require WHOIS or Google lookups — can retain most of the predictive power of the full feature set. This 25-feature “no_external” subset is persisted alongside the full set in feature_sets.json so that both configurations can be evaluated with identical modeling code.'
  )
);

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: BODY_FONT, size: BODY_SIZE },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = '/mnt/user-data/outputs/CS7331_Final_Report_Section2_DataUnderstanding_Draft.docx';
  fs.writeFileSync(out, buf);
  console.log('Wrote', out);
});

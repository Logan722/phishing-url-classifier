// Build the CS 7331 project proposal DOCX for Project Team 5

const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const fs = require('fs');

const BODY_FONT = 'Calibri';
const BODY_SIZE = 22; // 11pt (half-points)

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

const label = (text) =>
  new Paragraph({
    spacing: { before: 220, after: 80, line: 300 },
    alignment: AlignmentType.LEFT,
    children: [t(text, { bold: true })],
  });

const title = (text) =>
  new Paragraph({
    spacing: { before: 240, after: 200, line: 300 },
    alignment: AlignmentType.LEFT,
    children: [t(text, { bold: true, size: 26 })], // 13pt
  });

const refPara = (text) =>
  new Paragraph({
    spacing: { after: 80, line: 280 },
    alignment: AlignmentType.LEFT,
    indent: { left: 360, hanging: 360 },
    children: [t(text)],
  });

const children = [];

// Identity block (Section P)
children.push(identity('Project Team 5'));
children.push(identity('Daniel Oni (SMU ID: 50377321), Safia Khan'));
children.push(identity('CS 7331 - Data Mining'));
children.push(identity('Project Proposal'));

// Title (body-style bold, not cover-page)
children.push(title('Phishing URL Classification Using the UCI Phishing Websites Dataset'));

// Problem and Motivation
children.push(label('Problem and Motivation'));
children.push(
  para(
    'Phishing websites imitate legitimate services to steal credentials and financial information. Despite long-running defenses, phishing remains one of the most common initial attack vectors reported in the FBI Internet Crime Complaint Center annual reports and in industry threat intelligence. Users typically rely on browser or email filters that classify URLs before a page loads, so the quality of those filters directly affects how many phishing attempts succeed.'
  )
);
children.push(
  para(
    'We want to apply the data mining techniques from Modules 2 through 4 to this problem. The goal is to build a classifier that distinguishes phishing URLs from legitimate ones using URL-structural and page-level features, compare the performance of several standard classification algorithms, and identify which features drive the predictions. The deliverable is both a working classifier and a comparative analysis that speaks to how such filters are tuned in practice.'
  )
);

// Dataset
children.push(label('Dataset'));
children.push(
  para(
    'We will use the UCI Phishing Websites Dataset, which contains approximately 11,000 URLs labeled as phishing or legitimate. For each URL, researchers have extracted 30 features covering URL structure (length, number of subdomains, use of IP addresses in place of a domain, URL shortening), security indicators (HTTPS presence, SSL certificate state), domain characteristics (domain age, registration length), and page-level signals (request-URL redirection, abnormal URL patterns). The dataset is roughly balanced between the two classes, which lets us use standard evaluation metrics without heavy class-imbalance correction.'
  )
);

// Hypothesis
children.push(label('Hypothesis'));
children.push(
  para(
    'We hypothesize that URL-structural and page-level features alone can classify phishing versus legitimate URLs at F1 ≥ 0.90 on a held-out test set, and that ensemble methods (boosting) will outperform individual classifiers. We further expect the most predictive features to include domain age, HTTPS presence, and URL length, consistent with findings in prior work.'
  )
);

// Methodology
children.push(label('Methodology'));
children.push(
  para(
    'Our pipeline follows the standard data mining lifecycle from Module 1-2. We will first perform exploratory data analysis on the training portion of the data, computing summary statistics for each feature using every column’s own available observations rather than filtering rows with any missing values. We will then compute a correlation matrix covering all numeric features and examine both feature-feature and feature-label associations. Missing values, where present, will be handled per feature with the justification documented in the preprocessing section of the final report.'
  )
);
children.push(
  para(
    'For modeling, we will use a stratified 80/20 train-test split and compare five classification algorithms from Module 4: Decision Tree (M4-3), Naive Bayes (M4-5), Support Vector Machine (M4-6), k-Nearest Neighbors (M4-7), and Boosting (M4-9). Each algorithm will be tuned using 5-fold cross-validation on the training set across a documented hyperparameter grid. Features will be standardized with StandardScaler before fitting the distance-based models (kNN, SVM) so that no single feature dominates by scale.'
  )
);

// Evaluation
children.push(label('Evaluation'));
children.push(
  para(
    'Models will be compared on accuracy, precision, recall, F1, and ROC-AUC on the held-out test set, following the metrics framework in Module 4-4. We will produce confusion matrices for each model and overlay ROC curves to compare them directly. Because security problems care about both false alarms and missed attacks, we will report per-class precision and recall rather than aggregate accuracy alone. Feature importance will be measured using the native importances from tree-based models and permutation importance for the others, which lets us report which features contributed most consistently across model families.'
  )
);

// Timeline
children.push(label('Timeline'));
children.push(
  para(
    'Weeks 8-9: exploratory data analysis and preprocessing. Week 10: Decision Tree and Naive Bayes. Week 11: kNN and SVM. Week 12: Boosting and cross-validated hyperparameter tuning across all models. Week 13: full evaluation, feature importance analysis, and the first draft of the written report. Week 14: finalize the report and build the presentation deck. Week 15: rehearsal, presentation, and final submission on Canvas.'
  )
);

// Team Roles
children.push(label('Team Roles'));
children.push(
  para(
    'Daniel Oni will own the Decision Tree, SVM, and Boosting models, the feature importance analysis, and the Results, Discussion, Related Work, and Conclusion sections of the report, along with speaker notes and rehearsal. Safia Khan will own the exploratory data analysis, preprocessing (missing values, normalization, train-test split), the Naive Bayes and kNN models, confusion matrices and ROC-curve plots, the IEEE reference list, and final code cleanup. The proposal document, the presentation deck, and the final Canvas submission are shared responsibilities.'
  )
);

// References
children.push(label('References'));
children.push(
  refPara(
    '[1] R. M. Mohammad, F. Thabtah, and L. McCluskey, “Intelligent rule-based phishing websites classification,” IET Information Security, vol. 8, no. 3, pp. 153–160, 2014.'
  )
);
children.push(
  refPara(
    '[2] O. K. Sahingoz, E. Buber, O. Demir, and B. Diri, “Machine learning based phishing detection from URLs,” Expert Systems with Applications, vol. 117, pp. 345–357, 2019.'
  )
);
children.push(
  refPara(
    '[3] A. K. Jain and B. B. Gupta, “Towards detection of phishing websites on client-side using machine learning based approach,” Telecommunication Systems, vol. 68, no. 4, pp. 687–700, 2018.'
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
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 }, // 0.75"
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = '/mnt/user-data/outputs/CS7331_Project_Proposal_Team5.docx';
  fs.writeFileSync(out, buf);
  console.log('Wrote', out);
});

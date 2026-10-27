# Phishing URL Classification

Semester project for **CS 7331 – Data Mining** (SMU, Fall 2026, Prof. Xia Luo). Project Team 5: **Daniel Oni** and **Safia Khan**.

Trains and compares five supervised classifiers on the UCI Phishing Websites dataset to detect phishing URLs. Each classifier is evaluated on two feature sets (full 30 features / no-external-lookups 25 features) with and without SMOTEN oversampling, hyperparameter-tuned with 5-fold stratified CV on F1.

## Contributors

**Daniel Oni** — Project proposal (joint); Section 2 Data Understanding draft; three modeling notebooks (Decision Tree, SVM, Gradient Boosting) with their result and prediction CSVs; References section additions ([1]–[10] from the proposal literature review). Owns the remaining work on the combined metrics table, feature-importance analysis, the Section 5 Evaluation writeup, the Section 6 Discussion and Conclusion, the Related Work section, slide-deck authoring (joint), speaker notes and rehearsal, and the Canvas submission.

**Safia Khan** — EDA and preprocessing notebooks (`01_EDA`, `02_Preprocessing`) including the dataset-quality finding that 5,206 rows in the published UCI dataset are exact duplicates and must be removed before the train/test split; Naive Bayes modeling (Gaussian, Bernoulli, and Categorical variants) and kNN modeling with their result and prediction CSVs; Section 3 Data Preparation writeup; References [11] SMOTE and [12] imbalanced-learn. Owns the remaining work on confusion matrices, ROC/AUC plots, the IEEE reference list finalization, and code cleanup.

Joint ownership: project proposal, slide deck, final-report integration, presentation delivery, and Canvas submission.

## Dataset

UCI Phishing Websites Dataset (`ucimlrepo` id = 327), 11,055 labeled URL records, 30 categorical features. [UCI link](https://doi.org/10.24432/C51W2X).

**Data quality finding** (methodological contribution, not consistently reported in prior work on this benchmark): 5,206 exact duplicate rows removed, leaving 5,849 unique records. 64 pairs of records share identical feature vectors but have opposite labels — kept as genuine labeling ambiguity. Class balance after dedup: 51.6% phishing / 48.4% legitimate.

## Models

| Model | Owner | F1 | AUC | Best config |
|---|---|---|---|---|
| Gradient Boosting | Daniel | **0.9564** | **0.9939** | full, no SMOTE, lr=0.1, depth=5, 200 trees |
| SVM | Daniel | 0.9465 | 0.9762 | full, SMOTE, RBF, C=1, gamma=0.1 |
| kNN | Safia | 0.9397 | 0.9833 | full, no SMOTE, Hamming, k=5 |
| Decision Tree | Daniel | 0.9349 | 0.9760 | full, no SMOTE, entropy, depth=12 |
| Categorical NB | Safia | 0.9267 | 0.9798 | full, no SMOTE, alpha=5.0 |

(F1 on held-out test set, best configuration per model across feature-set × SMOTE variants.)

## Repository layout

```
/notebooks       6 Colab notebooks — EDA, preprocessing, 5 classifiers
/data            preprocessed splits (train/test), feature set definitions, raw dataset copy
/results         per-model CSVs: metrics (<model>_results.csv) and test-set predictions (<model>_predictions.csv)
/figures         EDA plots (class distribution, feature distributions by class, correlation heatmap, kNN k tuning)
/reports         CS 7331 project proposal (PDF, graded 25/25) and in-progress final report snapshot
/scripts         Build scripts for the proposal DOCX, Section 2 DOCX draft, and three modeling notebook scaffolds
```

## How to reproduce

The notebooks are built to run in Google Colab against a shared Google Drive folder laid out exactly like this repo (`/data`, `/results`, `/colab notebooks`). To run locally instead:

1. Install dependencies:
   ```bash
   pip install pandas scikit-learn imbalanced-learn ucimlrepo matplotlib seaborn
   ```
2. In each notebook's **setup** cell, replace the `BASE = '/content/drive/MyDrive/CS7331_Phishing'` path with the local path to this repo.
3. Run `01_EDA_Safia.ipynb` → `02_Preprocessing_Safia.ipynb` first to regenerate the splits (or use the shipped splits in `/data`).
4. Then run the five modeling notebooks (`03`–`06`) in any order. Each is independent and writes its own result/prediction CSVs to `/results`.

The random seed is fixed at 42 everywhere, so results are reproducible.

## Reproducible splits

The `/data` folder ships the exact train/test splits used by every modeling notebook:

- `X_train.csv` / `X_test.csv` / `y_train.csv` / `y_test.csv` — 80/20 stratified split (4,679 / 1,170 records)
- `X_train_smote.csv` / `y_train_smote.csv` — SMOTEN variant on the full feature set
- `X_train_smote_noext.csv` / `y_train_smote_noext.csv` — SMOTEN variant on the no-external-lookups 25-feature subset
- `feature_sets.json` — the two feature configurations (full / no_external)
- `phishing.csv` — raw dataset copy as returned by `ucimlrepo`
- `feature_summary_by_class.csv` — per-value proportions by class, from EDA

## References

Full IEEE reference list is in `reports/CS7331_Final_Report_Team5_snapshot_2026-10-27.md`. Core references:

- Mohammad, Thabtah, McCluskey — UCI dataset donation and original rule-based classification
- Almujahid, Haq, Alshehri (PeerJ CS 2024) — comparative evaluation of ML algorithms on this dataset
- Chiew, Tan, Wong, Yong, Tiong (Information Sciences 2019) — HEFS feature-selection framework on same dataset
- Chawla, Bowyer, Hall, Kegelmeyer (JAIR 2002) — SMOTE
- Lemaître, Nogueira, Aridas (JMLR 2017) — imbalanced-learn (SMOTEN implementation)

## Status

Project in progress. Target presentation and submission: Sunday 2026-11-30.

- [x] Project proposal (full marks: 25/25)
- [x] EDA and preprocessing (Safia)
- [x] 5 classifiers trained and tuned (Daniel: DT, SVM, GB; Safia: NB, kNN)
- [x] Section 2 (Data Understanding), Section 3 (Data Preparation), references pasted into final report
- [ ] Section 1 (Business Understanding) and Section 4 (Modeling) writeup
- [ ] Combined metrics table, confusion matrices, ROC curves
- [ ] Feature importance analysis
- [ ] Section 5 (Evaluation) and Section 6 (Discussion/Conclusion) writeups
- [ ] Slides and speaker notes
- [ ] Final Canvas submission

## License

Course project. Not for redistribution.

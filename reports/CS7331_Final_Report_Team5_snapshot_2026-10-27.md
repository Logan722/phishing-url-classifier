**Project Team:** 

Safia Khan 

Daniel Opemipo Oni

**Final Report**

***Section 1: Business Understanding***

  
  

***Section 2: Data Understanding***

  

**Dataset Overview**

We obtained the UCI Phishing Websites Dataset via the ucimlrepo Python package (id = 327), which returned 11,055 labeled URL records with 30 input features and a binary class label. A copy of the raw CSV is saved to the project's shared data folder so both team members work from an identical snapshot. The dataset is distributed under the Creative Commons Attribution 4.0 license and was donated to UCI by Mohammad and McCluskey \[1, 2\].

  

All features are categorical and integer-encoded, which matters for later model-choice decisions: 21 features are binary-coded as {−1, 1}, 8 features are three-level-coded as {−1, 0, 1}, and one feature (redirect) is binary-coded as {0, 1}. The convention throughout is that −1 indicates a phishing-like value, 0 indicates a suspicious or ambiguous value, and 1 indicates a legitimate-looking value. We verified at load time that there are 0 missing values across all 31 columns, so no imputation step is required.

  

**Data Quality**

Beyond the no-missing-values check, we audited the dataset for row-level duplication, as duplicate records would otherwise leak between the training and test splits and inflate the reported performance. The audit found 5,206 exact row duplicates and 5,270 duplicates when considering features only (ignoring the label). The difference means that 64 pairs of records have identical feature vectors but opposite labels, representing genuine ambiguity in the labeling process (for example, URLs whose features lie on the boundary between the two classes). We keep these conflicting rows because they reflect a real property of the labeling task; we remove only the 5,206 exact duplicates.

  

After deduplication the dataset contains 5,849 unique records — approximately half the original size. To our knowledge the published literature on this benchmark does not consistently report this duplication (Mohammad, Thabtah, and McCluskey \[2\]; Almujahid, Haq, and Alshehri \[5\]; Chiew et al. \[10\] all evaluate on the full 11,055 records without flagging the duplication issue). Our results are therefore not directly comparable to accuracies reported on the full dataset, where identical records can appear in both the training and test sets. All subsequent EDA, preprocessing, modeling, and evaluation steps are performed on the 5,849-record deduplicated set.

  

**Class Distribution**

Of the 5,849 unique records, 3,019 (51.6%) are labeled phishing and 2,830 (48.4%) are labeled legitimate (Figure 1). The class ratio shifted from the original dataset (55.7% legitimate / 44.3% phishing) because the 5,206 removed duplicates were disproportionately in the legitimate class, which is itself a methodological observation worth noting — any model trained on the raw dataset is implicitly fit to a legitimacy-biased distribution. On the deduplicated data the classes are essentially balanced, so accuracy becomes a reasonable headline metric when reported alongside precision, recall, and F1. We preserve the ratio using a stratified 80/20 train/test split (4,679 training records, 1,170 test records). As a secondary preprocessing variant we apply SMOTEN oversampling to the training set only, following Prof. Luo's proposal feedback, to compare the SMOTE-balanced training variant against the stratified-only baseline.

  

**Feature Characteristics**

The 30 features fall into four thematic groups that reflect where the detector would look in a real deployment: URL characteristics observable before loading the page (for example url\_length, having\_ip\_address, having\_at\_symbol, having\_sub\_domain, shortining\_service), page behavior and abnormal request patterns (for example request\_url, url\_of\_anchor, links\_in\_tags, sfh, abnormal\_url), HTML and JavaScript indicators (for example iframe, popupwindow, rightclick, on\_mouseover, redirect), and domain and third-party reputation signals (for example age\_of\_domain, dnsrecord, web\_traffic, page\_rank, google\_index).

  

Because every feature is already a coded indicator rather than a raw numerical measurement — URL length is recorded as short, medium, or long rather than as a character count — feature scaling will have limited effect on distance-based models. More consequential for model choice: this coding is a poor fit for Gaussian Naive Bayes, which assumes continuous features, so we additionally test a Categorical Naive Bayes variant that matches the data's actual encoding. The same reasoning drove the choice of SMOTEN (categorical SMOTE) over the standard SMOTE for the oversampling variant, since standard SMOTE would produce interpolated values outside the coded {−1, 0, 1} set.

  

**Univariate Distributions by Class**

We computed per-feature value distributions split by class on the deduplicated data. Figure 2 presents grouped bar charts of all 30 features by class, and the full table of per-value proportions by class is saved as feature\_summary\_by\_class.csv in the shared data folder.

  

Three features show very strong class separation. SSL/HTTPS state (sslfinal\_state) is coded −1 for 61.7% of phishing records compared to only 9.3% of legitimate records; conversely, 90.4% of legitimate records are coded 1 versus only 14.6% of phishing records. The hyphenated-domain indicator (prefix\_suffix) is the most consistently phishing-indicative single feature in the dataset: 100% of phishing records are coded −1 compared to 75.2% of legitimate records. The anchor-URL indicator (url\_of\_anchor) is coded −1 for 65.7% of phishing records compared to only 0.7% of legitimate records.

  

Features with moderate separation include web\_traffic, having\_sub\_domain, request\_url, links\_in\_tags, and sfh. Three features that our proposal predicted would be strong predictors show a mixed picture when checked against the data: HTTPS presence (sslfinal\_state) is in fact among the top signals and confirms that part of our hypothesis, but age\_of\_domain separates only modestly (phishing 52.0% versus legitimate 45.7% at −1), and url\_length shows almost no separation (phishing 82.0% versus legitimate 77.8% at −1). Several features show near-identical distributions across the two classes and are unlikely to contribute meaningful predictive power: favicon, popupwindow, iframe, rightclick, and submitting\_to\_email each differ by less than two percentage points between phishing and legitimate records. This finding partially revises the feature ranking proposed in the project proposal, and we carry the revised ranking into the Results and Discussion sections.

  

**Correlation Structure**

We computed the full Pearson correlation matrix across all 30 numeric features on the deduplicated data rather than selecting a hand-picked subset, so any feature-feature redundancy visible in the data is reflected in the analysis (Figure 3). The matrix is used to flag highly collinear feature pairs that may distort coefficient-based interpretations in margin-based models and to detect clusters of features that measure overlapping concepts. The matrix shows two clusters of strongly correlated features. The first contains favicon, port, popupwindow, iframe, submitting\_to\_email, and on\_mouseover, mostly HTML and JavaScript indicators, with the strongest pair (favicon and popupwindow) correlated above 0.8. The second contains shortining\_service, double\_slash\_redirecting, https\_token, and abnormal\_url. Both clusters are only weakly correlated with the class label, so they add redundancy rather than predictive signal. By contrast, the five domain-reputation features (age\_of\_domain, dnsrecord, web\_traffic, page\_rank, google\_index) are only weakly correlated with one another, which suggests they capture different aspects of domain legitimacy rather than a single shared signal. The features most strongly correlated with the class label (in absolute value) are sslfinal\_state (0.69) and url\_of\_anchor (0.68), followed by prefix\_suffix (0.38).

  

**Implications for Preprocessing and Modeling**

Four decisions follow directly from the EDA. First, deduplication must happen before the train/test split, which is implemented as the first preprocessing step. Second, the uniform integer encoding and absence of missing values mean the remaining preprocessing is minimal: a stratified 80/20 train/test split, scaling applied inside the kNN and SVM pipelines rather than globally, and SMOTEN oversampling of the training set as a secondary variant to compare against the stratified-only baseline. Third, the categorical nature of the features justifies testing a Categorical Naive Bayes model in addition to the Gaussian variant more commonly reported in prior work on this dataset. Fourth, the observation that roughly five to six features carry the bulk of the class-separating signal, with another five to eight carrying moderate signal and the remainder contributing almost nothing, supports the viability of our secondary hypothesis that a no-external-lookups feature subset — dropping the five features that require WHOIS, DNS, or third-party lookups — can retain most of the predictive power of the full feature set. This 25-feature "no\_external" subset is persisted alongside the full set in feature\_sets.json so that both configurations can be evaluated with identical modeling code.

***Section 3: Data Preparation***

  

All preparation steps are implemented in a single notebook (02\_Preprocessing) that reads the raw CSV and writes every derived dataset to the shared data folder, so the modeling notebooks for all five classifiers train and test on identical inputs. The order of the steps matters: any step that learns from the data, such as oversampling or scaling, is applied only after the train/test split and only to training records.

  

**Data Cleaning**

No values are missing in any of the 31 columns, so no imputation was needed. The only cleaning step is the removal of the 5,206 exact duplicate rows described in Section 2, which reduces the data to 5,849 records. Deduplication is performed before the train/test split so that no record can appear in both the training and the test set. The 64 pairs of records that share a feature vector but carry opposite labels (128 rows in total) are retained. They are not copies, and removing either side of a pair would mean choosing which label is correct with no basis for doing so.

  

**Label and Feature Encoding**

The original label codes phishing as −1 and legitimate as 1. We re-encode it as a binary target named phishing, with phishing = 1 and legitimate = 0, so that precision, recall, and F1 are computed with phishing as the positive class, the class a deployed detector is meant to catch.

  

The 30 input features are kept in their original integer coding rather than one-hot encoded. The three-level features are ordered (phishing-like, suspicious, legitimate-looking), so treating −1, 0, and 1 as ordinal values preserves meaningful distances for kNN and SVM, and tree-based models are unaffected by the coding. Model-specific transformations are applied inside each model's pipeline rather than to the stored data. Categorical Naive Bayes requires non-negative category indices, so its pipeline shifts every value by +1 (to 0, 1, 2), and Bernoulli Naive Bayes binarizes each feature at zero.

  

**Feature Subsets**

Two feature configurations are defined and saved to feature\_sets.json: the full set of 30 features, and a 25-feature no-external-lookups set that removes age\_of\_domain, dnsrecord, web\_traffic, page\_rank, and google\_index, the five features that depend on WHOIS records, DNS queries, or third-party traffic and search services. We use the name “no external lookups” rather than “URL-only” because the remaining 25 features still include page-content indicators such as url\_of\_anchor and sfh, which require loading the page.

  

Both configurations use the same train/test split, so differences in performance can be attributed to the features alone. Removing the five external features makes the remaining feature vectors less distinctive: 2,280 of the 5,849 records (39.0%) become identical to another record on the 25 remaining features, and 597 of the 1,170 test records have an exact 25-feature match in the training set. We do not deduplicate a second time for this subset. These records are distinct websites that differ on the external features, so they are not copies of one another, and removing them would change the test set and make the two configurations no longer comparable. The more informative statistic is label conflict. The number of records whose feature vector is shared with a record of the opposite label rises from 128 (2.2%) with all 30 features to only 184 (3.1%) with 25, which suggests the external features resolve relatively little ambiguity that the remaining features cannot. We return to this point in Section 5.

  

**Train/Test Split**

The deduplicated data is split 80/20 into a training set of 4,679 records and a test set of 1,170 records, stratified by class and with a fixed random seed (42) so the split is reproducible. Stratification holds the phishing share at 51.6% in the full data, the training set, and the test set. The test set is used only once per final model; all hyperparameter tuning is done with 5-fold stratified cross-validation on the training set (Section 4).

  

**Class Balancing with SMOTEN**

Following Prof. Luo’s proposal feedback, we evaluate SMOTE oversampling as a preprocessing variant. Because all features are categorical, we use SMOTEN \[11\], the categorical variant implemented in the imbalanced-learn library \[12\]. Instead of interpolating between records, SMOTEN builds each synthetic record by taking the most common value of every feature among a minority-class record’s nearest neighbors, measured with the value difference metric. Standard SMOTE would produce values such as 0.37 that do not exist in the coded {−1, 0, 1} scheme. We confirmed that every synthetic record contains only values that occur in the original data.

  

SMOTEN is applied to the training set only, never to the test set, so that evaluation reflects the real class distribution. On the full feature set it adds 151 synthetic legitimate records, raising the training set from 4,679 to 4,830 records with an exact 50/50 balance. A separate SMOTEN run is performed on the 25-feature training set, so that its synthetic records are generated using only the features that configuration can see. During cross-validation, SMOTEN is placed inside an imbalanced-learn pipeline so that it is refit on the training folds of each split and never generates records from the validation fold. Because the deduplicated data is already close to balanced, we expected oversampling to have a small effect; Section 5 compares each model with and without it.

  

**Feature Scaling**

All 30 features already lie between −1 and 1, so scaling has limited effect, but distance- and margin-based models remain sensitive to differences in variance between features. We therefore apply standardization (zero mean, unit variance) inside the kNN and SVM pipelines, where it is fit on the training folds only, and leave the stored data unscaled. Naive Bayes, the Decision Tree, and boosting use the unscaled features, since they are not sensitive to feature scale.

  

**Summary of Prepared Data**

*Table 1: Record counts and class balance at each preparation step*

|  |  |  |
| :-: | :-: | :-: |
| \*\*Dataset\*\* | \*\*Records\*\* | \*\*Phishing share\*\* |
| Raw dataset | 11,055 | 44.3% |
| After deduplication | 5,849 | 51.6% |
| Training set | 4,679 | 51.6% |
| Test set | 1,170 | 51.6% |
| Training set after SMOTEN | 4,830 | 50.0% |

  

All derived datasets are saved to the shared data folder: X\_train, X\_test, y\_train, and y\_test; X\_train\_smote and y\_train\_smote for the full feature set; X\_train\_smote\_noext and y\_train\_smote\_noext for the 25-feature set; and feature\_sets.json. Every modeling notebook loads these files rather than repeating the preprocessing, which guarantees that all five classifiers are trained and evaluated on the same data.

  

***Section 4: Modeling***

  

***Section 5: Evaluation***

  

***Section 6: Deployment and Discussion***

  

***References***

\[1\] R. Mohammad and L. McCluskey, “Phishing Websites,” UCI Machine Learning Repository, 2012. \[Online\]. Available: https://doi.org/10.24432/C51W2X

  

\[2\] R. M. Mohammad, F. Thabtah, and L. McCluskey, “An assessment of features related to phishing websites using an automated technique,” in Proc. Int. Conf. Internet Technology and Secured Transactions (ICITST), London, U.K., 2012.

  

\[3\] R. Bahuang and D. M. Y. Beh, “Detecting phishing uniform resource locator (URL) using machine learning,” J. Computing Technologies and Creative Content, vol. 7, no. 2, pp. 35–41, Dec. 2022.

  

\[4\] S. A. Khan, W. Khan, and A. Hussain, “Phishing attacks and websites classification using machine learning and multiple datasets (a comparative analysis),” 2020, arXiv:2101.02552.

  

\[5\] N. F. Almujahid, M. A. Haq, and M. Alshehri, “Comparative evaluation of machine learning algorithms for phishing site detection,” PeerJ Computer Science, vol. 10, Art. no. e2131, 2024, doi: 10.7717/peerj-cs.2131.

  

\[6\] O. K. Sahingoz, E. Buber, O. Demir, and B. Diri, “Machine learning based phishing detection from URLs,” Expert Systems with Applications, vol. 117, pp. 345–357, 2019.

  

\[7\] A. K. Jain and B. B. Gupta, “Towards detection of phishing websites on client-side using machine learning based approach,” Telecommunication Systems, vol. 68, no. 4, pp. 687–700, 2018.

  

\[8\] J. Ma, L. K. Saul, S. Savage, and G. M. Voelker, “Beyond blacklists: learning to detect malicious web sites from suspicious URLs,” in Proc. 15th ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining (KDD), Paris, France, 2009, pp. 1245–1254.

  

\[9\] R. S. Rao and A. R. Pais, “Detection of phishing websites using an efficient feature-based machine learning framework,” Neural Computing and Applications, vol. 31, no. 8, pp. 3851–3873, 2019.

  

\[10\] K. L. Chiew, C. L. Tan, K. Wong, K. S. C. Yong, and W. K. Tiong, “A new hybrid ensemble feature selection framework for machine learning-based phishing detection system,” Information Sciences, vol. 484, pp. 153–166, 2019.

  

\[11\] N. V. Chawla, K. W. Bowyer, L. O. Hall, and W. P. Kegelmeyer, “SMOTE: Synthetic minority over-sampling technique,” J. Artif. Intell. Res., vol. 16, pp. 321–357, 2002.

  

\[12\] G. Lemaître, F. Nogueira, and C. K. Aridas, “Imbalanced-learn: A Python toolbox to tackle the curse of imbalanced datasets in machine learning,” J. Mach. Learn. Res., vol. 18, no. 17, pp. 1–5, 2017.
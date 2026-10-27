"""Build the Decision Tree Colab notebook for Dawn's chunk #14, mirroring Safia's NB notebook structure."""
import json

cells = []

# ---------- cell 1: title + description ----------
cells.append({
    "cell_type": "markdown",
    "metadata": {"id": "intro"},
    "source": [
        "# 04 \u2013 Decision Tree\n",
        "**CS 5331/7331 \u00b7 Project Team Five**\n",
        "\n",
        "Trains a Decision Tree classifier on both feature sets (full 30 / no-external 25), with and without SMOTEN.\n",
        "Hyperparameters are tuned with 5-fold stratified CV on the training set (scored on F1), then each best model is scored once on the test set.",
    ],
})

# ---------- cell 2: setup + load splits ----------
cells.append({
    "cell_type": "code",
    "metadata": {"id": "setup"},
    "execution_count": None,
    "outputs": [],
    "source": [
        "from google.colab import drive\n",
        "drive.mount('/content/drive')\n",
        "\n",
        "!pip install -q imbalanced-learn\n",
        "\n",
        "import os, json\n",
        "import pandas as pd\n",
        "from sklearn.tree import DecisionTreeClassifier\n",
        "from sklearn.model_selection import StratifiedKFold, GridSearchCV\n",
        "from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score\n",
        "from imblearn.pipeline import Pipeline\n",
        "from imblearn.over_sampling import SMOTEN\n",
        "\n",
        "BASE = '/content/drive/MyDrive/CS7331_Phishing'\n",
        "DATA_DIR = f'{BASE}/data'\n",
        "RESULTS_DIR = f'{BASE}/results'\n",
        "os.makedirs(RESULTS_DIR, exist_ok=True)\n",
        "SEED = 42\n",
        "\n",
        "# load the exact splits Safia saved from preprocessing\n",
        "X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')\n",
        "X_test = pd.read_csv(f'{DATA_DIR}/X_test.csv')\n",
        "y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv')['phishing']\n",
        "y_test = pd.read_csv(f'{DATA_DIR}/y_test.csv')['phishing']\n",
        "with open(f'{DATA_DIR}/feature_sets.json') as f:\n",
        "    FEATURE_SETS = json.load(f)\n",
        "\n",
        "print(X_train.shape, X_test.shape, y_train.mean().round(3))",
    ],
})

# ---------- cell 3: model config + make_pipe ----------
cells.append({
    "cell_type": "code",
    "metadata": {"id": "config"},
    "execution_count": None,
    "outputs": [],
    "source": [
        "from joblib import Memory\n",
        "CACHE = Memory('/content/smote_cache', verbose=0)  # remembers SMOTEN results so it doesn't redo the same thing\n",
        "cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)\n",
        "\n",
        "# Decision Tree is simple to tune:\n",
        "#  - max_depth limits how deep the tree can grow (bigger = more overfitting risk)\n",
        "#  - min_samples_split / min_samples_leaf stop the tree from making tiny splits off a few rows\n",
        "#  - criterion picks the split rule (gini is sklearn default, entropy mirrors ID3/C4.5 from lecture)\n",
        "GRID = {\n",
        "    'tree__max_depth': [3, 5, 8, 12, 20, None],\n",
        "    'tree__min_samples_split': [2, 10, 20],\n",
        "    'tree__min_samples_leaf': [1, 5, 10],\n",
        "    'tree__criterion': ['gini', 'entropy'],\n",
        "}\n",
        "\n",
        "def make_pipe(use_smote):\n",
        "    steps = []\n",
        "    if use_smote:\n",
        "        steps.append(('smote', SMOTEN(random_state=SEED)))  # inside the pipeline so it only touches training folds, test set stays untouched\n",
        "    steps.append(('tree', DecisionTreeClassifier(random_state=SEED)))\n",
        "    return Pipeline(steps, memory=CACHE)",
    ],
})

# ---------- cell 4: experiment loop ----------
cells.append({
    "cell_type": "code",
    "metadata": {"id": "loop"},
    "execution_count": None,
    "outputs": [],
    "source": [
        "rows = []\n",
        "preds = pd.DataFrame({'y_true': y_test.values})\n",
        "\n",
        "for fs_name, cols in FEATURE_SETS.items():\n",
        "    for use_smote in [False, True]:\n",
        "        search = GridSearchCV(make_pipe(use_smote), GRID, scoring='f1', cv=cv, n_jobs=-1)\n",
        "        search.fit(X_train[cols], y_train)\n",
        "        print(f\"done: DecisionTree | {fs_name} | {'smote' if use_smote else 'no_smote'}\")\n",
        "\n",
        "        best = search.best_estimator_  # refit on the full training set with the best setting\n",
        "        y_pred = best.predict(X_test[cols])\n",
        "        y_prob = best.predict_proba(X_test[cols])[:, 1]\n",
        "\n",
        "        smote_tag = 'smote' if use_smote else 'no_smote'\n",
        "        rows.append({\n",
        "            'model': 'DecisionTree', 'features': fs_name, 'smote': smote_tag,\n",
        "            'best_params': search.best_params_,\n",
        "            'cv_f1': round(search.best_score_, 4),\n",
        "            'accuracy': round(accuracy_score(y_test, y_pred), 4),\n",
        "            'precision': round(precision_score(y_test, y_pred), 4),\n",
        "            'recall': round(recall_score(y_test, y_pred), 4),\n",
        "            'f1': round(f1_score(y_test, y_pred), 4),\n",
        "            'roc_auc': round(roc_auc_score(y_test, y_prob), 4),\n",
        "        })\n",
        "        # keep predictions for the confusion matrices and ROC curves later\n",
        "        key = f'DecisionTree|{fs_name}|{smote_tag}'\n",
        "        preds[f'{key}|pred'] = y_pred\n",
        "        preds[f'{key}|prob'] = y_prob\n",
        "\n",
        "results = pd.DataFrame(rows)\n",
        "results.sort_values('cv_f1', ascending=False)",
    ],
})

# ---------- cell 5: save ----------
cells.append({
    "cell_type": "code",
    "metadata": {"id": "save"},
    "execution_count": None,
    "outputs": [],
    "source": [
        "results.to_csv(f'{RESULTS_DIR}/dt_results.csv', index=False)\n",
        "preds.to_csv(f'{RESULTS_DIR}/dt_predictions.csv', index=False)\n",
        "print(\"Saved dt_results.csv and dt_predictions.csv to /results\")",
    ],
})

notebook = {
    "nbformat": 4,
    "nbformat_minor": 0,
    "metadata": {
        "colab": {"provenance": []},
        "kernelspec": {"name": "python3", "display_name": "Python 3"},
        "language_info": {"name": "python"},
    },
    "cells": cells,
}

out = '/mnt/user-data/outputs/04_DecisionTree_Daniel.ipynb'
with open(out, 'w') as f:
    json.dump(notebook, f, indent=1)
print(f"Wrote {out}")

"""Build the combined-metrics Colab notebook for Dawn's chunk #19."""
import json

cells = []

cells.append({
    "cell_type": "markdown",
    "metadata": {"id": "intro"},
    "source": [
        "# 07 – Combined Metrics Table\n",
        "**CS 5331/7331 · Project Team Five**\n",
        "\n",
        "Reads the 5 per-model result CSVs from `/results` (nb, knn, dt, svm, gb) and produces two consolidated outputs:\n",
        "\n",
        "- `all_results.csv`  — every configuration run across all 5 classifiers (feature-set × SMOTE variant × model/variant). The full detail for the appendix.\n",
        "- `summary_best_per_model.csv` — the single best configuration per classifier variant, selected by **CV F1** (not test F1) so the test set is used only once. The headline table for Section 5 Evaluation.",
    ],
})

cells.append({
    "cell_type": "code",
    "metadata": {"id": "setup"},
    "execution_count": None,
    "outputs": [],
    "source": [
        "from google.colab import drive\n",
        "drive.mount('/content/drive')\n",
        "\n",
        "import os\n",
        "import pandas as pd\n",
        "\n",
        "BASE = '/content/drive/MyDrive/CS7331_Phishing'\n",
        "RESULTS_DIR = f'{BASE}/results'\n",
        "\n",
        "# load every per-model result CSV\n",
        "files = ['nb_results.csv', 'knn_results.csv', 'dt_results.csv', 'svm_results.csv', 'gb_results.csv']\n",
        "frames = [pd.read_csv(f'{RESULTS_DIR}/{f}') for f in files]\n",
        "combined = pd.concat(frames, ignore_index=True)\n",
        "print(f'Loaded {len(combined)} configurations across {combined[\"model\"].nunique()} classifier variants')",
    ],
})

cells.append({
    "cell_type": "code",
    "metadata": {"id": "sort"},
    "execution_count": None,
    "outputs": [],
    "source": [
        "# natural reading order: Naive Bayes variants first, then DT, kNN, SVM, GB (as they appear in the proposal)\n",
        "model_order = ['GaussianNB', 'BernoulliNB', 'CategoricalNB', 'DecisionTree', 'kNN', 'SVM', 'GradientBoosting']\n",
        "features_order = ['full', 'no_external']\n",
        "smote_order = ['no_smote', 'smote']\n",
        "\n",
        "combined['_m'] = combined['model'].map({m: i for i, m in enumerate(model_order)})\n",
        "combined['_f'] = combined['features'].map({f: i for i, f in enumerate(features_order)})\n",
        "combined['_s'] = combined['smote'].map({s: i for i, s in enumerate(smote_order)})\n",
        "combined = combined.sort_values(['_m', '_f', '_s']).drop(columns=['_m', '_f', '_s']).reset_index(drop=True)\n",
        "combined",
    ],
})

cells.append({
    "cell_type": "code",
    "metadata": {"id": "summary"},
    "execution_count": None,
    "outputs": [],
    "source": [
        "# pick the single best configuration per model by CV F1 (not test F1)\n",
        "# so the test set is used only once for the final evaluation\n",
        "summary = (combined\n",
        "           .sort_values('cv_f1', ascending=False)\n",
        "           .drop_duplicates(subset=['model'], keep='first')\n",
        "           .copy())\n",
        "\n",
        "# then order the summary by test F1 for the headline comparison across models\n",
        "summary = summary.sort_values('f1', ascending=False).reset_index(drop=True)\n",
        "summary[['model', 'features', 'smote', 'cv_f1', 'accuracy', 'precision', 'recall', 'f1', 'roc_auc']]",
    ],
})

cells.append({
    "cell_type": "code",
    "metadata": {"id": "save"},
    "execution_count": None,
    "outputs": [],
    "source": [
        "combined.to_csv(f'{RESULTS_DIR}/all_results.csv', index=False)\n",
        "summary.to_csv(f'{RESULTS_DIR}/summary_best_per_model.csv', index=False)\n",
        "print('Saved all_results.csv and summary_best_per_model.csv to /results')",
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

out = '/mnt/user-data/outputs/07_MetricsTable_Daniel.ipynb'
with open(out, 'w') as f:
    json.dump(notebook, f, indent=1)
print(f'Wrote {out}')

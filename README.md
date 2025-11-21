# 🛒 TP3 - Système de Gestion de Stock

Un système de gestion de produits développé en C#  avec support des produits standards et produits frais périssables.

## 📋 Description

Ce projet implémente un système de gestion de stock qui permet de gérer deux types de produits :
- **Produits standards** : articles sans date de péremption
- **Produits frais** : articles périssables avec date limite de consommation

## 🚀 Technologies

- **Langage** : C# 12.0
- **Type de projet** : Application Console

## 📁 Structure du Projet

```
tp3/
├── Produit.cs          # Classe de base pour les produits
├── ProduitFrais.cs     # Classe dérivée pour les produits périssables
├── Program.cs          # Programme principal de test
└── README.md           # Ce fichier
```

## 🏗️ Architecture

### Classe `Produit`

Classe de base représentant un produit générique.

**Propriétés :**
- `Reference` : Référence unique du produit (string)
- `NomProduit` : Nom du produit (string)
- `PrixUnitaire` : Prix unitaire (double)
- `QuantiteStock` : Quantité en stock (double)

**Méthodes :**
- `AjouterQuantite(float quantite)` : Ajoute une quantité au stock
- `RetirerQuantite(float quantite)` : Retire une quantité du stock (minimum 0)
- `ToString()` : Affiche les informations du produit

### Classe `ProduitFrais`

Classe héritant de `Produit` avec gestion de la date de péremption.

**Propriétés supplémentaires :**
- `DateLimite` : Date limite de consommation (DateTime)

**Méthodes supplémentaires :**
- `JoursRestants()` : Calcule le nombre de jours avant expiration
- `ToString()` : Affiche les informations du produit avec date limite

## 💻 Utilisation

### Créer un produit standard

```csharp
Produit produit = new Produit("REF001", "Lait", 1.20, 50.0);
```

### Créer un produit frais

```csharp
ProduitFrais produitFrais = new ProduitFrais(
    "REF003", 
    "Yaourt", 
    0.50, 
    20.0, 
    DateTime.Now.AddDays(5)
);
```

### Gérer le stock

```csharp
// Ajouter du stock
produit.AjouterQuantite(10);

// Retirer du stock
produit.RetirerQuantite(5);

// Vérifier les jours restants (produits frais uniquement)
int jours = produitFrais.JoursRestants();
```

### Afficher les informations

```csharp
Console.WriteLine(produit);
// Output: Référence: REF001, Nom: Lait, Prix unitaire: 1,20 €, Quantité en stock: 55
```

## 🎯 Fonctionnalités

-  Gestion du stock avec ajout/retrait de quantités
-  Protection contre les stocks négatifs
-  Calcul automatique des jours restants avant péremption
-  Détection des produits périmés
-  Filtrage des produits par quantité
-  Héritage et polymorphisme orienté objet

## 🔧 Installation et Exécution

### Prérequis
- .NET 8.0 SDK ou supérieur
- Visual Studio 2022 (ou VS Code avec extension C#)

### Cloner le dépôt
```bash
git clone https://github.com/YassineChelly04/tp3-korbi-2eme-gsil.git
cd tp3-korbi-2eme-gsil
```

### Compiler et exécuter
```bash
dotnet build
dotnet run
```

Ou depuis Visual Studio : `F5` ou `Ctrl+F5`

## 📊 Exemple de Sortie

```
=== Liste initiale des produits ===
Référence: REF001, Nom: Lait, Prix unitaire: 1,20 €, Quantité en stock: 50
Référence: REF002, Nom: Farine, Prix unitaire: 0,80 €, Quantité en stock: 10
Référence: REF003, Nom: Yaourt, Prix unitaire: 0,50 €, Quantité en stock: 20, Date limite: 25/12/2024, Jours restants: 5
Référence: REF004, Nom: Fromage, Prix unitaire: 2,00 €, Quantité en stock: 10, Date limite: 18/12/2024, Jours restants: -2

=== Produits avec quantité nulle ===
Référence: REF002, Nom: Farine, Prix unitaire: 0,80 €, Quantité en stock: 0

=== Produits frais périmés ===
Référence: REF004, Nom: Fromage, Prix unitaire: 2,00 €, Quantité en stock: 10, Date limite: 18/12/2024, Jours restants: -2
```

## 📚 Concepts C# Utilisés

- **Héritage** : `ProduitFrais` hérite de `Produit`
- **Polymorphisme** : Liste contenant différents types de produits
- **Redéfinition de méthodes** : `override` de `ToString()`
- **Auto-propriétés** : Syntaxe `{ get; set; }`
- **LINQ** : `Where()`, `OfType()` pour filtrer les collections
- **String interpolation** : Formatage avec `$"..."`
- **DateTime** : Manipulation de dates

## 👨‍💻 Auteur

**Yassine Chelly**
- GitHub: [@YassineChelly04](https://github.com/YassineChelly04)

  
**Fares Falleh**

## 📄 Licence

Ce projet est un tp académique (2ème année GSIL) et toutes la promotion de GSIL de l'année 2025-2026.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation

---

using tp3;

// Saisir la liste des produits
List<Produit> ListProduits = new List<Produit>
{
    new Produit("REF001", "Lait", 1.20f, 50.0f),
    new Produit("REF002", "Farine", 0.80f, 10.0f),
    new ProduitFrais("REF003", "Yaourt", 0.50f, 20.0f, DateTime.Now.AddDays(5)),
    new ProduitFrais("REF004", "Fromage", 2.00f, 10.0f, DateTime.Now.AddDays(-2))
};

Console.WriteLine("=== Liste initiale des produits ===");
foreach (var produit in ListProduits)
{
    Console.WriteLine(produit);
}
Console.WriteLine();

// Ajouter une quantité 10 au produit "REF001"
var produitREF001 = ListProduits.Find(p => p.Reference == "REF001");
if (produitREF001 != null)
{
    produitREF001.AjouterQuantite(10);
    Console.WriteLine($"Ajout de 10 unités au produit {produitREF001.Reference}");
}

// Retirer 10 au produit "REF002"
var produitREF002 = ListProduits.Find(p => p.Reference == "REF002");
if (produitREF002 != null)
{
    produitREF002.RetirerQuantite(10);
    Console.WriteLine($"Retrait de 10 unités au produit {produitREF002.Reference}");
}
Console.WriteLine();

Console.WriteLine("=== Liste après modifications ===");
foreach (var produit in ListProduits)
{
    Console.WriteLine(produit);
}
Console.WriteLine();

// Afficher les produits ayant une quantité nulle
Console.WriteLine("=== Produits avec quantité nulle ===");
var produitsQuantiteNulle = ListProduits.Where(p => p.QuantiteStock == 0).ToList();
if (produitsQuantiteNulle.Count > 0)
{
    foreach (var produit in produitsQuantiteNulle)
    {
        Console.WriteLine(produit);
    }
}
else
{
    Console.WriteLine("Aucun produit avec quantité nulle.");
}
Console.WriteLine();

// Afficher les produits frais périmés
Console.WriteLine("=== Produits frais périmés ===");
var produitsFraisPerimes = ListProduits.OfType<ProduitFrais>()
                                       .Where(p => p.JoursRestants() < 0)
                                       .ToList();
if (produitsFraisPerimes.Count > 0)
{
    foreach (var produit in produitsFraisPerimes)
    {
        Console.WriteLine(produit);
    }
}
else
{
    Console.WriteLine("Aucun produit frais périmé.");
}

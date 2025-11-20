namespace tp3
{
    public class Produit
    {
        public string Reference { get; set; }
        public string NomProduit { get; set; }
        public double PrixUnitaire { get; set; }
        public double QuantiteStock { get; set; }

        public Produit()
        {
        }

        public Produit(string reference, string nomProduit, double prixUnitaire, double quantiteStock)
        {
            Reference = reference;
            NomProduit = nomProduit;
            PrixUnitaire = prixUnitaire;
            QuantiteStock = quantiteStock;
        }

        public override string ToString()
        {
            return $"Référence: {Reference}, Nom: {NomProduit}, Prix unitaire: {PrixUnitaire:C}, Quantité en stock: {QuantiteStock}";
        }

        public void AjouterQuantite(float quantite)
        {
            QuantiteStock += quantite;
        }

        public void RetirerQuantite(float quantite)
        {
            if (quantite >= QuantiteStock)
            {
                QuantiteStock = 0;
            }
            else
            {
                QuantiteStock -= quantite;
            }
        }
    }
}

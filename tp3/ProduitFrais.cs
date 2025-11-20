namespace tp3
{
    public class ProduitFrais : Produit
    {
        public DateTime DateLimite { get; set; }

        public ProduitFrais() : base()
        {
        }

        public ProduitFrais(string reference, string nomProduit, double prixUnitaire, double quantiteStock, DateTime dateLimite)
            : base(reference, nomProduit, prixUnitaire, quantiteStock)
        {
            DateLimite = dateLimite;
        }

        public int JoursRestants()
        {
            TimeSpan difference = DateLimite - DateTime.Now;
            return (int)difference.TotalDays;
        }

        public override string ToString()
        {
            return base.ToString() + $", Date limite: {DateLimite:dd/MM/yyyy}, Jours restants: {JoursRestants()}";
        }
    }
}

import { Routes } from '@angular/router';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { ProduitComponent } from './pages/produit/produit.component';
import { PanierComponent } from './pages/panier/panier.component';
import { ValiderCommandeComponent } from './pages/valider-commande/valider-commande.component';
import { DashboardAdminComponent } from './pages/dashboard-admin/dashboard-admin.component';

export const routes: Routes = [
     { path: '', redirectTo: '/accueil', pathMatch: 'full' },
    { path: 'accueil', component: AccueilComponent },
    { path: 'produits', component: ProduitComponent },
    { path: 'panier', component: PanierComponent },
    { path: 'validerCommande', component: ValiderCommandeComponent },
    { path: 'admin', component: DashboardAdminComponent },
];

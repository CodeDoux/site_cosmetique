import { Routes } from '@angular/router';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { ProduitComponent } from './pages/produit/produit.component';
import { PanierComponent } from './pages/panier/panier.component';
import { ValiderCommandeComponent } from './pages/valider-commande/valider-commande.component';
import { DashboardAdminComponent } from './pages/dashboard-admin/dashboard-admin.component';
import { AdminProduitComponent } from './pages/admin-produit/admin-produit.component';
import { AdminLayoutComponent } from './pages/admin-layout/admin-layout.component';
import { AdminCategorieComponent } from './pages/admin-categorie/admin-categorie.component';
import { AdminCommandeComponent } from './pages/admin-commande/admin-commande.component';
import { AdminClientComponent } from './pages/admin-client/admin-client.component';
import { HomeComponent } from './pages/accueil/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { GammeComponent } from './pages/gamme/gamme.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminPaiementComponent } from './pages/admin-paiement/admin-paiement.component';
import { AdminLivraisonComponent } from './pages/admin-livraison/admin-livraison.component';
import { AdminPromotionComponent } from './pages/admin-promotion/admin-promotion.component';
import { AdminGammeComponent } from './pages/admin-gamme/admin-gamme.component';
import { AdminUserComponent } from './pages/admin-user/admin-user.component';
import { DetailsGammeComponent } from './pages/details-gamme/details-gamme.component';
import { DetailsProduitComponent } from './pages/details-produit/details-produit.component';

export const routes: Routes = [
     { path: '', redirectTo: 'home/accueil', pathMatch: 'full' },
     { path: '***', redirectTo: 'home/accueil' },
     { path: 'login', component: LoginComponent },

    
    
    {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: 'accueil', component: AccueilComponent },
    { path: 'produits', component: ProduitComponent },
    { path: 'panier', component: PanierComponent },
    { path: 'validerCommande', component: ValiderCommandeComponent },
    { path: 'gammes', component: GammeComponent },
    { path: 'contact', component: ContactComponent },
    {path: 'gammes/:id',component: DetailsGammeComponent},
    { path: 'produits/:id', component: DetailsProduitComponent }

    ]
  },
    
    {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {path: '',redirectTo: 'dashboard',pathMatch: 'full'},
      { path: 'dashboard', component: DashboardAdminComponent },
      { path: 'admin-produits', component: AdminProduitComponent },
      { path: 'admin-categories', component: AdminCategorieComponent },
      { path: 'admin-commandes', component: AdminCommandeComponent },
      { path: 'admin-clients', component: AdminClientComponent },
      { path: 'admin-paiements', component: AdminPaiementComponent },
      { path: 'admin-livraisons', component: AdminLivraisonComponent },
      { path: 'admin-promotions', component: AdminPromotionComponent },
      { path: 'admin-gammes', component: AdminGammeComponent },
      { path: 'admin-users', component: AdminUserComponent },
    ]
  },
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  }
];


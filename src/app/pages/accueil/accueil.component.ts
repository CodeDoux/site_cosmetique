import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Produit } from '../../models/produit';
import { Gamme, StatutGamme } from '../../models/gamme';
import { ProduitService } from '../../services/produit.service';
import { GammeService } from '../../services/gamme.service';
import { PanierService } from '../../services/panier.service';
import { ToastService } from '../../services/toast.service';
import { PromotionService } from '../../services/promotion.service';

@Component({
  selector: 'app-accueil',
  imports: [CommonModule, RouterLink, FormsModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css'
})
export class AccueilComponent implements OnInit, OnDestroy {

  storageUrl = environment.storageUrl;

  // ─── Hero Slider ───
  heroSlides = [
    {
      image:       'images/produit3.jpg',
      tag:         'Nouveautés 2026',
      titre:       'Beauté, soin et confiance\nen un seul endroit.',
      description: 'Découvrez notre sélection de produits cosmétiques naturels pour sublimer votre beauté au quotidien.',
      btnLabel:    'Acheter maintenant',
      lien:        '/produits',
    },
    {
      image:       'images/produit1.jpg',
      tag:         'Soldes jusqu\'à -40%',
      titre:       'Prenez soin de votre\npeau chaque jour.',
      description: 'Crèmes, sérums, soins capillaires — tout ce qu\'il faut pour votre routine beauté.',
      btnLabel:    'Voir les promotions',
      lien:        '/produits',
    },
    {
      image:       'images/produit2.jpg',
      tag:         'Nos Gammes exclusives',
      titre:       'Des collections pensées\npour vous.',
      description: 'Des gammes complètes soigneusement sélectionnées pour répondre à chaque besoin de beauté.',
      btnLabel:    'Découvrir les gammes',
      lien:        '/gammes',
    },
  ];

  currentSlide   = 0;
  private sliderInterval: any;

  // ─── Onglet produits actif ───
  activeTab: string = 'nouveau';

  // ─── Catégories (statiques) ───
  categories = [
    { name: 'Capillaire',      icon: '💆‍♀️' },
    { name: 'Beauté',          icon: '💄'  },
    { name: 'Parfums',         icon: '🌸'  },
    { name: 'Hygiène',         icon: '🧴'  },
    { name: 'Corps et visage', icon: '✨'  },
    { name: 'Autres',          icon: '🖌️' }
  ];

  menuItems: string[] = [
    'Capillaires', 'Beauté', 'Parfums',
    'Corps et visage', 'Pédicure manicure', 'Hygiène', 'Autres'
  ];

  // ─── Produits ───
  products: Produit[] = [];
  isLoadingProducts = false;
  errorProducts     = false;

   // ─── Promotions ───
promoCommande: any = null;  // promotion type commande (avec code)
promoProduit:  any = null;  // promotion type produit (liée à des produits)
isLoadingPromos = false;

  // ─── Gammes ───
  gammes: Gamme[] = [];
  isLoadingGammes = false;
  errorGammes     = false;

  // ─── Rituels ───
  rituels: { titre: string; contenu: string; etapes?: string[] }[] = [
    {
      titre: 'Hydratez votre peau chaque matin',
      contenu: 'Appliquez votre crème corps juste après la douche, sur une peau encore légèrement humide. Les actifs pénètrent mieux et l\'hydratation dure plus longtemps.',
      etapes: ['Sortez de la douche', 'Séchez légèrement', 'Appliquez la crème']
    },
    {
      titre: 'Routine visage en 3 étapes',
      contenu: 'Une bonne routine n\'a pas besoin d\'être complexe. Nettoyez, hydratez et protégez. Ces trois gestes simples, faits chaque jour, transforment votre peau en quelques semaines.'
    },
    {
      titre: 'Les bons points de parfum',
      contenu: 'Appliquez votre parfum sur les points de chaleur : poignets, cou, creux du coude. La chaleur diffuse le sillage toute la journée.'
    },
    {
      titre: 'Le rituel du soir',
      contenu: 'Accordez-vous 10 minutes chaque soir. Démaquillez, appliquez un sérum, buvez une tisane. Votre corps se régénère la nuit, aidez-le.'
    }
  ];

  // ─── Collections / Marques ───
  marques = [
  { nom: 'Dove',       initiales: 'DV', categorie: 'Soin du corps & visage',    brand: 'Dove',        logo: 'images/marques/dove.jpg'        },
  { nom: 'Vaseline',   initiales: 'VS', categorie: 'Hydratation intense',        brand: 'Vaseline',    logo: 'images/marques/vaseline.jpg'    },
  { nom: 'Nivea',      initiales: 'NV', categorie: 'Soin de la peau',            brand: 'Nivea',       logo: 'images/marques/nivea.jpg'       },
  { nom: 'L\'Oréal',   initiales: 'LO', categorie: 'Beauté & maquillage',        brand: 'LOreal',      logo: 'images/marques/loreal.jpg'      },
  { nom: 'Garnier',    initiales: 'GR', categorie: 'Soin naturel',               brand: 'Garnier',     logo: 'images/marques/garnier.jpg'     },
  { nom: 'Palmolive',  initiales: 'PL', categorie: 'Hygiène & douche',           brand: 'Palmolive',   logo: 'images/marques/palmolive.jpg'   },
  { nom: 'Neutrogena', initiales: 'NT', categorie: 'Soin dermatologique',        brand: 'Neutrogena',  logo: 'images/marques/neutrogena.jpg'  },
  { nom: 'Olay',       initiales: 'OL', categorie: 'Anti-âge & hydratation',    brand: 'Olay',        logo: 'images/marques/olay.jpg'        },
  { nom: 'Shea Moisture', initiales: 'SM', categorie: 'Soin capillaire naturel', brand: 'SheaMoisture',logo: 'images/marques/shea.jpg'        },
  { nom: 'Schwarzkopf',initiales: 'SK', categorie: 'Coloration cheveux',         brand: 'Schwarzkopf', logo: 'images/marques/schwarzkopf.jpg' },
  { nom: 'Pantene',    initiales: 'PT', categorie: 'Soin capillaire',            brand: 'Pantene',     logo: 'images/marques/pantene.jpg'     },
  { nom: 'Head & Shoulders', initiales: 'HS', categorie: 'Cuir chevelu',        brand: 'HeadShoulders',logo: 'images/marques/head.jpg'       },
];

  collectionPage    = 0;
  collectionVisible = 5; // nb visible à la fois

  get marquesVisibles() {
    const start = this.collectionPage * this.collectionVisible;
    return this.marques.slice(start, start + this.collectionVisible);
  }

  get collectionPages(): number[] {
    return Array(Math.ceil(this.marques.length / this.collectionVisible)).fill(0).map((_, i) => i);
  }

  get hasNextCollection(): boolean {
    return (this.collectionPage + 1) * this.collectionVisible < this.marques.length;
  }

  nextCollection(): void {
    if (this.hasNextCollection) this.collectionPage++;
  }

  prevCollection(): void {
    if (this.collectionPage > 0) this.collectionPage--;
  }

  goToCollection(index: number): void {
    this.collectionPage = index;
  }

  voirCollection(marque: any): void {
    this.router.navigate(['/home/produits'], { queryParams: { marque: marque.brand } });
  }

  voirProduitsPromo(): void {
    this.router.navigate(['/home/produits'], { queryParams: { en_promo: 1 } });
  }

  private destroy$ = new Subject<void>();

  constructor(
    private produitService: ProduitService,
    private gammeService:   GammeService,
    private panierService:  PanierService,
    private router:         Router,
    private toastService:   ToastService,
    private promotionService: PromotionService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadGammes();
    this.startSlider();
    this.loadPromotions();
  }

 



// Nouvelle méthode
loadPromotions(): void {
  this.isLoadingPromos = true;
  this.promotionService.getAll().subscribe({
      next: (res: any) => {
        const liste = Array.isArray(res) ? res : (res?.data ?? []);
        const actives = liste.filter((p: any) => p.estActif);

        // Promotion commande = pas de produits liés (ou produits vides)
        this.promoCommande = actives.find((p: any) =>
          !p.produits || p.produits.length === 0
        ) ?? null;

        // Promotion produit = avec produits liés
        this.promoProduit = actives.find((p: any) =>
          p.produits && p.produits.length > 0
        ) ?? null;

        this.isLoadingPromos = false;
      },
      error: () => { this.isLoadingPromos = false; }
    });
}

// Helpers
formatValeurPromo(promo: any): string {
  if (!promo) return '';
  return promo.type === 'POURCENTAGE'
    ? `-${promo.valeur}%`
    : `-${promo.valeur.toLocaleString('fr-FR')} Fr`;
}

getIconePromo(promo: any): string {
  if (!promo) return '🎁';
  const icons: Record<string, string> = {
    POURCENTAGE: '🏷️', MONTANT_FIXE: '💰'
  };
  return icons[promo.type] ?? '🎁';
}

  ngOnDestroy(): void {
    this.stopSlider();
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ══════════════════════════════════════════
  // CHARGEMENT PRODUITS
  // ══════════════════════════════════════════

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.errorProducts     = false;

    this.produitService.getProduits({ per_page: 12 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.products          = Array.isArray(res) ? res : (res?.data ?? []);
          this.isLoadingProducts = false;
        },
        error: (err) => {
          console.error('Erreur chargement produits :', err);
          this.products          = this.getFallbackProducts();
          this.isLoadingProducts = false;
          this.errorProducts     = true;
        }
      });
  }

  private getFallbackProducts(): Produit[] {
    return [
      { id: 1, nom: 'Beauty Ultimate Eye Shadow', prix: 11300, prixPromo: undefined, seuilAlerteStock: 2, statut: 'DISPONIBLE', stock: 10, note: 5, images: [] },
      { id: 2, nom: 'Nourishing Gold Kesar',      prix: 12600, prixPromo: 11600,     seuilAlerteStock: 2, statut: 'DISPONIBLE', stock: 8,  note: 5, images: [] },
      { id: 3, nom: 'Fab Karat Glow Combo',       prix: 13400, prixPromo: 12200,     seuilAlerteStock: 2, statut: 'DISPONIBLE', stock: 5,  note: 5, images: [] },
      { id: 4, nom: 'Makeup Success Kits',        prix: 12000, prixPromo: 11000,     seuilAlerteStock: 3, statut: 'DISPONIBLE', stock: 12, note: 4, images: [] },
      { id: 5, nom: 'Yunucha Eye Liner',           prix: 8600,  prixPromo: 7600,      seuilAlerteStock: 5, statut: 'DISPONIBLE', stock: 20, note: 5, images: [] },
      { id: 6, nom: 'Matte Poreless Liquid',       prix: 12200, prixPromo: 10400,     seuilAlerteStock: 2, statut: 'DISPONIBLE', stock: 7,  note: 5, images: [] },
      { id: 7, nom: 'Kobo Beauty Canvas Kit',      prix: 10400, prixPromo: undefined, seuilAlerteStock: 2, statut: 'DISPONIBLE', stock: 3,  note: 5, images: [] },
      { id: 8, nom: 'Renee Skin Prep Combo',       prix: 11500, prixPromo: 10600,     seuilAlerteStock: 2, statut: 'DISPONIBLE', stock: 6,  note: 5, images: [] },
    ];
  }


  // ══════════════════════════════════════════
  // CHARGEMENT GAMMES
  // ══════════════════════════════════════════

  loadGammes(): void {
    this.isLoadingGammes = true;
    this.errorGammes     = false;

    this.gammeService.getGammes({ per_page: 6 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.gammes          = Array.isArray(res) ? res : (res?.data ?? []);
          this.isLoadingGammes = false;
        },
        error: (err) => {
          console.error('Erreur chargement gammes :', err);
          this.gammes          = this.getFallbackGammes();
          this.isLoadingGammes = false;
          this.errorGammes     = true;
        }
      });
  }

  private getFallbackGammes(): Gamme[] {
    // Fallback aligné avec le nouveau modèle StatutGamme
    return [
      { nom: 'Soin du visage',     statut: 'DISPONIBLE', prix_fixe: 0, dateDebut: '', dateFin: '', description: 'Crèmes, sérums et masques pour une peau éclatante.',  image: undefined },
      { nom: 'Soin du corps',      statut: 'DISPONIBLE', prix_fixe: 0, dateDebut: '', dateFin: '', description: 'Laits, huiles et gommages pour une peau douce.',       image: undefined },
      { nom: 'Soin capillaire',    statut: 'DISPONIBLE', prix_fixe: 0, dateDebut: '', dateFin: '', description: 'Shampoings, masques et huiles pour vos cheveux.',       image: undefined },
      { nom: 'Parfums & Senteurs', statut: 'DISPONIBLE', prix_fixe: 0, dateDebut: '', dateFin: '', description: 'Eaux de parfum et brumes corporelles.',                image: undefined },
      { nom: 'Maquillage',         statut: 'DISPONIBLE', prix_fixe: 0, dateDebut: '', dateFin: '', description: 'Rouges à lèvres, fonds de teint et plus encore.',      image: undefined },
      { nom: 'Bien-être',          statut: 'DISPONIBLE', prix_fixe: 0, dateDebut: '', dateFin: '', description: 'Bougies, diffuseurs et rituels du soir.',              image: undefined },
    ];
  }


  // ══════════════════════════════════════════
  // PANIER
  // ══════════════════════════════════════════

  get cartCount(): number {
    return this.panierService.getProduits()
      .reduce((sum, item) => sum + item.quantite, 0);
  }

  addToCart(product: Produit): void {
    if (product.statut === 'EN_RUPTURE') return;
    this.panierService.ajouterProduit(product);
    this.toastService.show(`✓ ${product.nom} ajouté au panier`);
  }


  // ══════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════

  addToWishlist(product: Produit): void {
    console.log('Ajouté aux favoris :', product.nom);
  }

  quickView(product: Produit): void {
    this.router.navigate(['/produits'], { queryParams: { id: product.id } });
  }

  voirGamme(gamme: Gamme): void {
    if (gamme.statut !== 'DISPONIBLE') return;
    this.router.navigate(['/home/gammes', gamme.id]);
  }


  // ══════════════════════════════════════════
  // TABS PRODUITS
  // ══════════════════════════════════════════

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.loadProductsByTab(tab);
  }

 
  private loadProductsByTab(tab: string): void {
    this.isLoadingProducts = true;

    const filters: any = { per_page: 12 };
    if (tab === 'bestseller') filters.sort = 'bestseller';
    if (tab === 'nouveau')    filters.sort = 'nouveau';
    if (tab === 'promo')      filters.en_promo = 1;

    this.produitService.getProduits(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.products          = Array.isArray(res) ? res : (res?.data ?? []);
          this.isLoadingProducts = false;
        },
        error: () => {
          this.products          = this.getFallbackProducts();
          this.isLoadingProducts = false;
        }
      });
  }


  // ══════════════════════════════════════════
  // SLIDER HERO
  // ══════════════════════════════════════════

  startSlider(): void {
    this.sliderInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
    }, 5000);
  }

  stopSlider(): void {
    if (this.sliderInterval) clearInterval(this.sliderInterval);
  }

  goToSlide(index: number): void {
    this.stopSlider();
    this.currentSlide = index;
    this.startSlider();
  }

  nextSlide(): void {
    this.stopSlider();
    this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
    this.startSlider();
  }

  prevSlide(): void {
    this.stopSlider();
    this.currentSlide = (this.currentSlide - 1 + this.heroSlides.length) % this.heroSlides.length;
    this.startSlider();
  }

  // ══════════════════════════════════════════
  // HELPERS — PRODUIT
  // ══════════════════════════════════════════

  getImagePrimaire(produit: Produit): string {
    return this.produitService.getImagePrimaire(produit, this.storageUrl);
  }

  getReduction(product: Produit): number {
    if (!product.prixPromo) return 0;
    return Math.round((1 - product.prixPromo / product.prix) * 100);
  }

  isDisponible(product: Produit): boolean {
    return product.statut === 'DISPONIBLE';
  }


  // ══════════════════════════════════════════
  // HELPERS — GAMME
  // ══════════════════════════════════════════

  /**
   * URL image d'une gamme via gamme.image.chemin (type Image partagé avec Produit)
   */
  getGammeImageUrl(gamme: Gamme): string {
    return this.gammeService.getImageUrl(gamme);
  }

  /**
   * Prix affiché : prixPromo si existe, sinon prix_fixe
   */
  formatPrixGamme(gamme: Gamme): string {
    return this.gammeService.formatPrix(gamme);
  }

  /**
   * Nombre de produits dans la gamme
   */
  getNbProduitsGamme(gamme: Gamme): number {
    return gamme.produits?.length ?? 0;
  }

  /**
   * Badge réduction gamme
   */
  getReductionGamme(gamme: Gamme): number {
    return this.gammeService.getReduction(gamme);
  }

  isGammeDisponible(gamme: Gamme): boolean {
    return gamme.statut === 'DISPONIBLE';
  }


  // ══════════════════════════════════════════
  // HELPERS — COMMUNS
  // ══════════════════════════════════════════

  getStars(rating: number = 0): number[] {
    return Array(5).fill(0).map((_, i) => i);
  }

  isStarFilled(index: number, rating: number = 0): boolean {
    return index < rating;
  }

  formatPrix(prix: number): string {
    return prix.toLocaleString('fr-FR') + ' Fr';
  }
}
import { Component, OnInit, OnDestroy, ViewEncapsulation, Renderer2, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProduitService }  from '../../services/produit.service';
import { PanierService }   from '../../services/panier.service';
import { ToastService }    from '../../services/toast.service';
import { GammeService }    from '../../services/gamme.service';
import { Produit }         from '../../models/produit';
import { environment }     from '../../../environments/environment';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-details-produit',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './details-produit.component.html',
  styleUrl: './details-produit.component.css'
})
export class DetailsProduitComponent implements OnInit, OnDestroy {

  storageUrl = environment.storageUrl;

  produit:    Produit | null = null;
  isLoading   = true;
  hasError    = false;
  errorMsg    = '';

  // Galerie images
  activeImageIndex = 0;

  // Quantité
  quantite = 1;

  // Produits similaires
  produitsSimilaires: Produit[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private produitService: ProduitService,
    private panierService:  PanierService,
    private toastService:   ToastService,
    private gammeService:   GammeService,
    private titleService: Title,
    private metaService: Meta,
    private renderer: Renderer2,
            @Inject(DOCUMENT) private document: Document
  ) {}
  setCanonicalURL(url?: string) {

  const canURL = url || this.document.URL;

  let link: HTMLLinkElement =
    this.document.querySelector("link[rel='canonical']") || this.renderer.createElement('link');

  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', canURL);

  this.renderer.appendChild(
    this.document.head,
    link
  );
}

  ngOnInit(): void {
    this.setCanonicalURL();
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = +params['id'];
      if (id) this.loadProduit(id);
    });
   
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadProduit(id: number): void {
    this.isLoading = true;
    this.hasError  = false;

    this.produitService.getProduit(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.produit   = data?.produit ?? data?.data ?? data;
           this.titleService.setTitle(
          `${this.produit!.nom} | Toulay Skin`
        );

        this.metaService.updateTag({
          name: 'description',
          content: this.produit?.description ?? ''
        });

        this.metaService.updateTag({
          property: 'og:title',
          content: this.produit?.nom ?? ''
        });

        this.metaService.updateTag({
          property: 'og:description',
          content: this.produit?.description ?? ''
        });

        this.metaService.updateTag({
          property: 'og:image',
          content: `${environment.apiUrl}/storage/${this.produit?.image_primaire?.chemin}`
        });

        this.metaService.updateTag({
          property: 'og:url',
          content: window.location.href
        });

        this.metaService.updateTag({
          property: 'og:type',
          content: 'product'
        });
          this.isLoading = false;
          this.activeImageIndex = 0;
          this.quantite  = 1;

          // Charger les produits similaires
          if (this.produit?.categorie?.nom) {
            this.loadProduitsSimilaires(this.produit.categorie.nom, id);
          }
        },
        error: (err) => {
          this.hasError  = true;
          this.errorMsg  = err?.error?.message || 'Produit introuvable.';
          this.isLoading = false;
        }
      });
  }

  ajouterAuPanier(produit: Produit): void {
    if (produit.statut === 'EN_RUPTURE') return;
    this.panierService.ajouterProduit(produit, 1);
    this.toastService.show(`✓ ${produit.nom} ajouté au panier`);
  }

  loadProduitsSimilaires(categorieNom: string, excludeId: number): void {
    this.produitService.getProduits({ categorie: categorieNom, per_page: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const liste = Array.isArray(res) ? res : (res?.data ?? []);
          this.produitsSimilaires = liste
            .filter((p: Produit) => p.id !== excludeId)
            .slice(0, 4);
        }
      });
  }


  // ══════════════════════════════════════════
  // GALERIE
  // ══════════════════════════════════════════

  get images(): any[] {
    if (!this.produit) return [];
    if (this.produit.images && this.produit.images.length > 0) {
      return this.produit.images;
    }
    if (this.produit.image_primaire) {
      return [this.produit.image_primaire];
    }
    return [];
  }

  get activeImage(): string {
    if (this.images.length === 0) return 'images/placeholder.jpg';
    const img = this.images[this.activeImageIndex];
    return `${this.storageUrl}${img.chemin ?? img}`;
  }

  getImageUrl(img: any): string {
    return `${this.storageUrl}${img.chemin ?? img}`;
  }

  setActiveImage(index: number): void {
    this.activeImageIndex = index;
  }

  prevImage(): void {
    this.activeImageIndex = (this.activeImageIndex - 1 + this.images.length) % this.images.length;
  }

  nextImage(): void {
    this.activeImageIndex = (this.activeImageIndex + 1) % this.images.length;
  }


  // ══════════════════════════════════════════
  // QUANTITÉ
  // ══════════════════════════════════════════

  increaseQty(): void {
    if (!this.produit) return;
    if (this.quantite < this.produit.stock) this.quantite++;
  }

  decreaseQty(): void {
    if (this.quantite > 1) this.quantite--;
  }


  // ══════════════════════════════════════════
  // PANIER
  // ══════════════════════════════════════════

  addToCart(): void {
    if (!this.produit || this.produit.statut === 'EN_RUPTURE') return;
    this.panierService.ajouterProduit(this.produit, this.quantite);
    this.toastService.show(`✓ ${this.produit.nom} ajouté au panier`);
  }

  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/home/panier']);
  }


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getPrixActuel(): number {
    if (!this.produit) return 0;
    return Number(this.produit.prixPromo ?? this.produit.prix);
  }

  getReduction(): number {
    if (!this.produit?.prixPromo) return 0;
    return Math.round((1 - Number(this.produit.prixPromo) / Number(this.produit.prix)) * 100);
  }

  formatPrix(prix: number | string): string {
    if (!prix) return '0 Fr';
    const n = typeof prix === 'string' ? parseFloat(prix) : prix;
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' Fr';
  }

  getStars(note: number = 0): number[] {
    return Array(5).fill(0);
  }

  isStarFilled(index: number, note: number = 0): boolean {
    return index < Math.round(note);
  }

  isStarHalf(index: number, note: number = 0): boolean {
    return index === Math.floor(note) && note % 1 >= 0.5;
  }

  getStatutLabel(): string {
    return this.produit?.statut === 'DISPONIBLE' ? 'En stock' : 'Rupture de stock';
  }

  getImageSimilaire(produit: Produit): string {
    return this.produitService.getImagePrimaire(produit, this.storageUrl);
  }

  voirProduit(id: number | undefined): void {
    if (!id) return;
    this.router.navigate(['/home/produits', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
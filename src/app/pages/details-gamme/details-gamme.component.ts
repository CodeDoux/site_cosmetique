import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GammeService } from '../../services/gamme.service';
import { PanierService } from '../../services/panier.service';
import { ToastService } from '../../services/toast.service';
import { Gamme, GammeProduit } from '../../models/gamme';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-details-gamme',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './details-gamme.component.html',
  styleUrl: './details-gamme.component.css'
})
export class DetailsGammeComponent implements OnInit, OnDestroy {

  storageUrl = environment.storageUrl;

  gamme: Gamme | null = null;
  isLoading  = true;
  hasError   = false;
  errorMsg   = '';

  // Image active dans la galerie produits
  private activeImageMap = new Map<number, number>();

  private destroy$ = new Subject<void>();

  constructor(
    private route:        ActivatedRoute,
    private router:       Router,
    private gammeService: GammeService,
    private panierService: PanierService,
    private toastService:  ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = +params['id'];
      if (id) this.loadGamme(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadGamme(id: number): void {
    this.isLoading = true;
    this.hasError  = false;

    this.gammeService.getGamme(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        this.gamme     = data?.gamme ?? data?.data ?? data;
        this.isLoading = false;
      },
      error: (err) => {
        this.hasError  = true;
        this.errorMsg  = err?.message || 'Impossible de charger la gamme.';
        this.isLoading = false;
      }
    });
  }

get gammeProduits(): any[] {
  if (!this.gamme?.produits) return [];
  return this.gamme.produits.map((p: any) => ({
    id:              p.pivot?.id ?? p.id,
    produit:         p,
    quantite:        p.pivot?.quantite ?? 1,
    valeur_unitaire: p.pivot?.valeur_unitaire ?? p.prixPromo ?? p.prix,
  }));
}


  // ══════════════════════════════════════════
  // PANIER — Ajouter toute la gamme
  // ══════════════════════════════════════════

  ajouterGammeAuPanier(): void {
  if (!this.gamme || !this.isDisponible()) return;
  this.panierService.ajouterGamme(this.gamme, 1);
  this.toastService.show(`✓ Gamme "${this.gamme.nom}" ajoutée au panier`);
}

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getImageUrl(gamme: Gamme): string {
    return this.gammeService.getImageUrl(gamme);
  }

  getProduitImageUrl(gp: GammeProduit): string {
  const img = gp.produit?.image_primaire ?? (gp.produit as any)?.imagePrimaire;
  if (!img?.chemin) return 'images/placeholder.jpg';
  return `${this.storageUrl}/${img.chemin}`;
}

  getActiveImageIndex(gpId: number): number {
    return this.activeImageMap.get(gpId) ?? 0;
  }

  setActiveImage(gpId: number, index: number): void {
    this.activeImageMap.set(gpId, index);
  }

  getStatutLabel(): string {
    if (!this.gamme) return '';
    return this.gammeService.getStatutLabel(this.gamme.statut);
  }

  getStatutClass(): string {
    if (!this.gamme) return '';
    return this.gammeService.getStatutClass(this.gamme.statut);
  }

  getReduction(): number {
    if (!this.gamme) return 0;
    return this.gammeService.getReduction(this.gamme);
  }

  formatPrix(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' Fr';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

 getValeurTotale(): number {
  return this.gammeProduits.reduce(
    (sum, gp) => sum + (Number(gp.valeur_unitaire) * Number(gp.quantite)), 0
  );
}

getEconomie(): number {
  const valeur = this.getValeurTotale();
  const prix   = Number(this.gamme?.prixPromo ?? this.gamme?.prix_fixe ?? 0);
  return Math.max(0, valeur - prix);
}

ajouterProduitAuPanier(gp: any): void {
  if (gp.produit?.statut === 'EN_RUPTURE') return;
  this.panierService.ajouterProduit(gp.produit, Number(gp.quantite));
  this.toastService.show(`✓ ${gp.produit.nom} ajouté au panier`);
}

  isDisponible(): boolean {
    return this.gamme?.statut === 'DISPONIBLE';
  }

  voirProduit(produitId: number): void {
    this.router.navigate(['/produits', produitId]);
  }
}
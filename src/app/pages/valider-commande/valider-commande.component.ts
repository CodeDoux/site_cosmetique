import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { PanierService } from '../../services/panier.service';
import { ProduitPanier } from '../../models/produit-panier';
import { environment } from '../../../environments/environment';
import { CommandesService } from '../../services/commande.service';
import { GammeService } from '../../services/gamme.service';

// ─── Types alignés avec CommandeRequest Laravel ───
type ModeLivraison = 'DOMICILE' | 'POINT_RELAIS' | 'RETRAIT_MAGASIN';
type ModePaiement  = 'EN_LIGNE' | 'EN_ESPECE';
type Operateur     = 'ORANGE_MONEY' | 'WAVE' | 'FREE_MONEY';

interface InviteInfo {
  nom:      string;
  email:    string;
  tel:      string;
  adresse:  string;
  ville:    string;
  quartier: string;
}

interface LigneCommande {
  produit_id?: number;
  gamme_id?:   number;
  quantite:    number;
}

interface CommandePayload {
  modeLivraison: ModeLivraison;
  adresse_id?:   number;         // si client connecté avec adresse enregistrée
  codePromo?:    string;
  lignes:        LigneCommande[];
  invite?:       InviteInfo;     // si non connecté
}

interface PaiementPayload {
  commande_id:   number;
  modePaiement:  ModePaiement;
  operateur?:    Operateur;
  telephone?:    string;
}

interface PointRelais {
  id:      number;
  nom:     string;
  adresse: string;
  ville:   string;
}

@Component({
  selector: 'app-valider-commande',
  imports: [CommonModule, RouterModule, FormsModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './valider-commande.component.html',
  styleUrl: './valider-commande.component.css'
})
export class ValiderCommandeComponent implements OnInit, OnDestroy {

  storageUrl = environment.storageUrl;
    private destroy$ = new Subject<void>();
    ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
  }


  currentStep = 1;

  // ─── Panier ───
  cartItems: ProduitPanier[] = [];

  // ─── Code promo ───
  codePromo   = '';
  discount    = 0;

  // ─── Étape 1 : Mode de livraison ───
  modeLivraison: ModeLivraison = 'DOMICILE';

  // Infos invité (si non connecté)
  inviteInfo: InviteInfo = {
    nom: '', email: '', tel: '',
    adresse: '', ville: '', quartier: ''
  };

  // Points relais (à charger depuis l'API si besoin)
  pointsRelais: PointRelais[] = [
    { id: 1, nom: 'Point relais Medina',    adresse: 'Rue 10, Medina',    ville: 'Dakar' },
    { id: 2, nom: 'Point relais Plateau',   adresse: 'Avenue Peytavin',   ville: 'Dakar' },
    { id: 3, nom: 'Point relais Parcelles', adresse: 'Cité Fadia',        ville: 'Dakar' },
  ];
  selectedPointRelaisId: number | null = null;

  // ─── Étape 2 : Paiement ───
  modePaiement: ModePaiement = 'EN_ESPECE';

  // Mobile Money
  operateur: Operateur     = 'ORANGE_MONEY';
  telephone = '';

  // ─── États ───
  isLoading  = false;
  formError  = '';
  commandeCreee: number | null = null;

  private subscription = new Subscription();

  constructor(
    private router:           Router,
    private panierService:    PanierService,
    private commandesService: CommandesService,
    private gammeService: GammeService
  ) {}

  ngOnInit(): void {
    this.cartItems = this.panierService.getProduits();
     // ← Récupérer le discount depuis le service panier
  this.discount  = this.panierService.getDiscount();
  this.codePromo = this.panierService.getCouponCode();

    this.subscription.add(
      this.panierService.getNombreProduits().subscribe(() => {
        this.cartItems = this.panierService.getProduits();
      })
    );

    if (this.cartItems.length === 0) {
      this.router.navigate(['/home/panier']);
    }
  }


  // ══════════════════════════════════════════
  // GETTERS FINANCIERS
  // ══════════════════════════════════════════

  get subtotal(): number {
    return this.panierService.getTotal();
  }

  get fraisLivraison(): number {
    if (this.modeLivraison === 'RETRAIT_MAGASIN') return 0;
    return this.subtotal >= 50000 ? 0 : 2000;
  }

  get total(): number {
    return this.subtotal + this.fraisLivraison - this.discount;
  }


  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantite, 0);
  }


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

 getImageUrl(item: ProduitPanier): string {
  if (item.type === 'GAMME' && item.gamme) {
    return this.gammeService.getImageUrl(item.gamme);
  }
  if (item.type === 'PRODUIT' && item.produit?.image_primaire) {
    return `${this.storageUrl}/${item.produit.image_primaire.chemin}`;
  }
  return 'images/placeholder.jpg';
}

  formatPrix(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' Fr';
  }

  getLivraisonLabel(mode: ModeLivraison): string {
    const labels: Record<ModeLivraison, string> = {
      DOMICILE:        'Livraison à domicile',
      POINT_RELAIS:    'Point relais',
      RETRAIT_MAGASIN: 'Retrait en magasin',
    };
    return labels[mode];
  }

  getPaiementLabel(mode: ModePaiement): string {
    return mode === 'EN_LIGNE' ? 'Paiement en ligne' : 'Paiement en espèces';
  }

  getOperateurLabel(op: Operateur): string {
    const labels: Record<Operateur, string> = {
      ORANGE_MONEY: 'Orange Money',
      WAVE:         'Wave',
      FREE_MONEY:   'Free Money',
    };
    return labels[op];
  }

  getSelectedPointRelais(): PointRelais | undefined {
    return this.pointsRelais.find(p => p.id === this.selectedPointRelaisId);
  }


  // ══════════════════════════════════════════
  // NAVIGATION ÉTAPES
  // ══════════════════════════════════════════

  goToStep(step: number): void {
    if (step === 2 && !this.validateEtape1()) return;
    if (step === 3 && !this.validateEtape2()) return;
    this.currentStep = step;
    this.formError   = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextStep(): void {
    if (this.currentStep < 3) this.goToStep(this.currentStep + 1);
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.formError = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }


  // ══════════════════════════════════════════
  // VALIDATIONS
  // ══════════════════════════════════════════

  validateEtape1(): boolean {
    this.formError = '';

    // ─── Infos contact obligatoires pour TOUS les modes ───
    if (!this.inviteInfo.nom.trim()) {
      this.formError = 'Votre nom est requis.'; return false;
    }
    if (!this.inviteInfo.email.trim()) {
      this.formError = 'Votre e-mail est requis.'; return false;
    }
    if (!this.inviteInfo.tel.trim()) {
      this.formError = 'Votre numéro de téléphone est requis.'; return false;
    }

    // ─── Adresse obligatoire uniquement pour DOMICILE ───
    if (this.modeLivraison === 'DOMICILE') {
      if (!this.inviteInfo.adresse.trim()) {
        this.formError = 'L\'adresse de livraison est requise.'; return false;
      }
      if (!this.inviteInfo.ville.trim()) {
        this.formError = 'La ville est requise.'; return false;
      }
    }

    // ─── Point relais sélectionné obligatoire ───
    if (this.modeLivraison === 'POINT_RELAIS' && !this.selectedPointRelaisId) {
      this.formError = 'Veuillez sélectionner un point relais.'; return false;
    }

    return true;
  }

  validateEtape2(): boolean {
    this.formError = '';

    if (this.modePaiement === 'EN_LIGNE') {
      if (!this.operateur) {
        this.formError = 'Veuillez sélectionner un opérateur.'; return false;
      }
      if (!this.telephone.trim()) {
        this.formError = 'Le numéro de téléphone est requis.'; return false;
      }
    }

    return true;
  }


  // ══════════════════════════════════════════
  // CONSTRUIRE LES PAYLOADS LARAVEL
  // ══════════════════════════════════════════

 private buildCommandePayload(): any {
  const lignes = this.cartItems.map(item => {
    if (item.type === 'GAMME') {
      return { gamme_id:   item.gamme!.id,   quantite: item.quantite };
    } else {
      return { produit_id: item.produit!.id, quantite: item.quantite };
    }
  });

  const payload: any = {
    modeLivraison: this.modeLivraison,
    lignes,
    codePromo: this.codePromo || undefined,
    paiement: {
      modePaiement: this.modePaiement,
      operateur:    this.modePaiement === 'EN_LIGNE' ? this.operateur : undefined,
      telephone:    this.modePaiement === 'EN_LIGNE' ? this.telephone : undefined,
    }
  };

  payload.invite = {
    nom:      this.inviteInfo.nom,
    email:    this.inviteInfo.email,
    tel:      this.inviteInfo.tel,
    adresse:  this.inviteInfo.adresse  || '',
    ville:    this.inviteInfo.ville    || '',
    quartier: this.inviteInfo.quartier || '',
  };

  if (this.modeLivraison === 'POINT_RELAIS') {
    const relais = this.getSelectedPointRelais();
    if (relais) {
      payload.invite.adresse = relais.adresse;
      payload.invite.ville   = relais.ville;
    }
  }

  return payload;
}

  private buildPaiementPayload(commandeId: number): PaiementPayload {
    const payload: PaiementPayload = {
      commande_id:  commandeId,
      modePaiement: this.modePaiement,
    };

    if (this.modePaiement === 'EN_LIGNE') {
      payload.operateur  = this.operateur;
      payload.telephone  = this.telephone;
    }

    return payload;
  }


  // ══════════════════════════════════════════
  // PASSER LA COMMANDE
  // ══════════════════════════════════════════

  placeOrder(): void {
  if (!this.validateEtape1() || !this.validateEtape2()) return;

  this.isLoading = true;
  this.formError = '';

  const commandePayload = this.buildCommandePayload();

  this.commandesService.createCommande(commandePayload).subscribe({
    next: (res: any) => {
      const commande   = res?.commande ?? res?.data ?? res;
      const commandeId = commande?.id;
      this.commandeCreee = commandeId;

      // ── Espèces → confirmation directe
      if (this.modePaiement === 'EN_ESPECE') {
        this.isLoading = false;
        this.panierService.viderPanier();
        this.currentStep = 4;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // ── En ligne → initier PayDunya
      this.commandesService.initierPaiement(commandeId, {
        modePaiement: 'EN_LIGNE',
        operateur:    this.operateur,
        telephone:    this.telephone,
      }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paiRes: any) => {
          this.isLoading = false;
          this.panierService.viderPanier();

          if (paiRes?.checkout_url) {
            window.location.href = paiRes.checkout_url; // ← redirection PayDunya
          } else {
            this.currentStep = 4;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          this.formError = err?.error?.message || 'Erreur lors du paiement.';
        }
      });
    },
    error: (err: any) => {
      this.isLoading = false;
      this.formError = err?.error?.message || 'Erreur lors de la création de la commande.';
    }
  });
}
}
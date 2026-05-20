import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

// ─── Interface Settings (à adapter selon votre modèle API) ───
export interface ContactSettings {
  address?: string;
  phones?: string[];
  emails?: string[];
  horaires?: string;
  instagram?: string;
  instagramHandle?: string;
  tiktok?: string;
  tiktokHandle?: string;
  facebook?: string;
  facebookHandle?: string;
  whatsapp?: string;
  whatsappLabel?: string;
}

@Component({
  selector: 'app-contact',
  imports: [CommonModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {

  settings: ContactSettings = {};
  isLoading: boolean = false;

  // TODO : décommenter quand le SettingAdminService sera prêt
  // constructor(private settingService: SettingAdminService) {}

  constructor() {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;

    // ─── Données statiques en attendant le service ───
    // TODO : remplacer par l'appel API ci-dessous quand le service sera disponible
    /*
    this.settingService.getSettings().subscribe({
      next: (data) => {
        this.settings = {
          address:         data.address,
          phones:          data.phones,       // ex: ['+221 78 185 73 13']
          emails:          data.emails,       // ex: ['contact@cobeauty.sn']
          horaires:        data.horaires,
          instagram:       data.instagram_url,
          instagramHandle: data.instagram_handle,
          tiktok:          data.tiktok_url,
          tiktokHandle:    data.tiktok_handle,
          facebook:        data.facebook_url,
          facebookHandle:  data.facebook_handle,
          whatsapp:        data.whatsapp_number,
          whatsappLabel:   data.whatsapp_label,
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement settings :', err);
        this.isLoading = false;
      }
    });
    */

    // Données par défaut (retirer quand l'API sera branchée)
    this.settings = {
      address:         'Rond Point Cipres / Jac Mbao, Dakar, Sénégal',
      phones:          ['+221 78 185 73 13', '+221 76 620 64 20'],
      emails:          ['contact@cobeauty.sn'],
      horaires:        'Lundi – Samedi : 9h00 – 18h00',
      instagram:       'https://instagram.com/cobeauty',
      instagramHandle: '@cobeauty',
      tiktok:          'https://tiktok.com/@cobeauty',
      tiktokHandle:    '@cobeauty',
      facebook:        'https://facebook.com/cobeauty',
      facebookHandle:  'CoBeauty',
      whatsapp:        '221781857313',
      whatsappLabel:   'Commandez ici',
    };

    this.isLoading = false;
  }
}
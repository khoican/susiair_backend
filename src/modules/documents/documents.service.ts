import { Injectable } from '@nestjs/common';
import { ANCHOR_DATE } from '../../common/constants/app.constant.js';
import { diffDays } from '../../common/utils/date.util.js';
import { MockDataService } from '../../mock-data/mock-data.service.js';

export type DocumentStatus = 'expired' | 'soon' | 'safe';

export interface DocumentItem {
  id: string;
  label: string;
  expiryDate: string;
  daysRemaining: number;
  status: DocumentStatus;
  badgeColor: string;
}

const BADGE_COLORS: Record<DocumentStatus, string> = {
  expired: '#E63757',
  soon: '#F59E0B',
  safe: '#1FBF8F',
};

/**
 * Layanan dokumen pilot: hitung sisa hari dan badge urgensi.
 */
@Injectable()
export class DocumentsService {
  constructor(private readonly mockData: MockDataService) {}

  /**
   * Ambil seluruh dokumen dengan sisa hari dan badge urgensi terhadap anchor date.
   * @returns {DocumentItem[]} Daftar dokumen terlengkapi.
   */
  getDocuments(): DocumentItem[] {
    const { warningDays } = this.mockData.getDocumentThresholds();

    return this.mockData.getDocuments().map((doc) => {
      const daysRemaining = diffDays(ANCHOR_DATE, doc.expiryDate);
      const status = this.classify(daysRemaining, warningDays);
      return {
        ...doc,
        daysRemaining,
        status,
        badgeColor: BADGE_COLORS[status],
      };
    });
  }

  /**
   * Klasifikasikan urgensi dokumen berdasarkan sisa hari.
   * @param {number} daysRemaining - Sisa hari menuju kadaluarsa.
   * @param {number} warningDays - Ambang hari untuk status `soon`.
   * @returns {DocumentStatus} `expired` bila `<= 0`, `soon` bila `<= warningDays`, selain itu `safe`.
   */
  private classify(daysRemaining: number, warningDays: number): DocumentStatus {
    if (daysRemaining <= 0) {
      return 'expired';
    }
    if (daysRemaining <= warningDays) {
      return 'soon';
    }
    return 'safe';
  }
}

import { MockDataService } from '../../mock-data/mock-data.service.js';
import { DocumentsService } from './documents.service.js';

describe('DocumentsService', () => {
  const service = new DocumentsService(new MockDataService());

  it('menghitung sisa hari terhadap anchor dan memberi badge', () => {
    const docs = service.getDocuments();
    const byId = Object.fromEntries(docs.map((doc) => [doc.id, doc]));

    expect(docs).toHaveLength(5);
    expect(byId.doc_license).toMatchObject({
      daysRemaining: 14,
      status: 'soon',
      badgeColor: '#F59E0B',
    });
    expect(byId.doc_medical).toMatchObject({
      daysRemaining: 27,
      status: 'soon',
      badgeColor: '#F59E0B',
    });
    expect(byId.doc_security).toMatchObject({
      daysRemaining: -14,
      status: 'expired',
      badgeColor: '#E63757',
    });
    expect(byId.doc_recurrent).toMatchObject({
      daysRemaining: 152,
      status: 'safe',
      badgeColor: '#1FBF8F',
    });
  });

  it('menandai dokumen tepat di ambang sebagai soon', () => {
    const service = new DocumentsService({
      getDocumentThresholds: () => ({ warningDays: 30, comment: '' }),
      getDocuments: () => [
        { id: 'exact', label: 'Exact', expiryDate: '2026-06-14' },
      ],
    } as unknown as MockDataService);

    expect(service.getDocuments()[0]).toMatchObject({
      daysRemaining: 30,
      status: 'soon',
    });
  });
});

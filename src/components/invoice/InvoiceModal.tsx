import React from 'react';
import { Modal } from '../ui/Modal';
import { InvoiceView } from './InvoiceView';
import { Order } from '../../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | any | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Tax Invoice — ${order.orderNumber || order.id}`}
      subtitle="GST Compliant Tax Invoice & Bill of Supply"
    >
      <InvoiceView order={order} onClose={onClose} showActions={true} />
    </Modal>
  );
};

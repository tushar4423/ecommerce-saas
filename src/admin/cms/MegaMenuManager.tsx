import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Layers, 
  Edit, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Link as LinkIcon, 
  Sparkles,
  LayoutTemplate,
  ExternalLink,
  Tag,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Zap,
  Compass
} from 'lucide-react';
import { 
  useGetNavigationMenuQuery, 
  useSaveNavigationMenuMutation,
  useGetCategoriesQuery,
  useGetCollectionsQuery,
  useCreateAuditLogMutation 
} from '../../store/api/ecommerceApi';
import { MegaMenuItem, MenuColumn, SubMenuItem, MenuPromoCard } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

// Utility helper to safely convert titles to URL slugs
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const MegaMenuManager: React.FC = () => {
  const toast = useToast();
  const { data: menuItems = [], isLoading } = useGetNavigationMenuQuery();
  const { data: dbCategories = [] } = useGetCategoriesQuery();
  const { data: dbCollections = [] } = useGetCollectionsQuery();
  const [saveMenu, { isLoading: isSaving }] = useSaveNavigationMenuMutation();
  const [createAuditLog] = useCreateAuditLogMutation();

  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

  // Top level edit modal
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);
  const [editingTopItem, setEditingTopItem] = useState<Partial<MegaMenuItem> | null>(null);
  const [isTopUrlAutoSync, setIsTopUrlAutoSync] = useState(true);

  // Column edit modal
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<{ id?: string; title: string; url: string } | null>(null);
  const [isColUrlAutoSync, setIsColUrlAutoSync] = useState(true);

  // Sub item modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<Partial<SubMenuItem> | null>(null);
  const [isSubUrlAutoSync, setIsSubUrlAutoSync] = useState(true);

  // Promo Card modal
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromoCard, setEditingPromoCard] = useState<Partial<MenuPromoCard> | null>(null);

  // Deletion confirm modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'topMenu' | 'column' | 'subItem' | 'promo' | 'footerLink' | 'footerColumn';
    id: string;
    secondaryId?: string;
    title: string;
  } | null>(null);

  // Footer navigation state
  const [footerSections, setFooterSections] = useState<Array<{
    id: string;
    title: string;
    links: Array<{ id: string; title: string; url: string; isExternal?: boolean; isActive: boolean }>;
  }>>(() => {
    const saved = localStorage.getItem('vedaaya_footer_nav_config');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'foot-1',
        title: 'Shop Ethnic Wear',
        links: [
          { id: 'fl-1', title: 'Handcrafted Kurtis', url: '/catalog?category=kurtis', isActive: true },
          { id: 'fl-2', title: 'Anarkali Suits & Sets', url: '/catalog?category=anarkali-sets', isActive: true },
          { id: 'fl-3', title: 'Festive Co-ords', url: '/catalog?category=festive-co-ords', isActive: true },
          { id: 'fl-4', title: 'Plus Size (XL - 5XL)', url: '/catalog?category=plus-size', isActive: true },
          { id: 'fl-5', title: 'New Festive Arrivals', url: '/catalog?category=new-arrivals', isActive: true },
        ],
      },
      {
        id: 'foot-2',
        title: 'Customer Care',
        links: [
          { id: 'fl-6', title: 'Track Your Order', url: '/orders', isActive: true },
          { id: 'fl-7', title: 'Returns & Exchange Policy', url: '/policies/returns', isActive: true },
          { id: 'fl-8', title: 'Shipping & Delivery Info', url: '/policies/shipping', isActive: true },
          { id: 'fl-9', title: 'Contact & WhatsApp Support', url: '/contact', isActive: true },
          { id: 'fl-10', title: 'Size & Fit Guide', url: '/size-guide', isActive: true },
        ],
      },
      {
        id: 'foot-3',
        title: 'Our Atelier & Heritage',
        links: [
          { id: 'fl-11', title: 'The Vedaaya Story', url: '/about', isActive: true },
          { id: 'fl-12', title: 'Jaipur Artisan Collective', url: '/artisans', isActive: true },
          { id: 'fl-13', title: 'Sustainable Mulmul & Pure Silks', url: '/fabrics', isActive: true },
          { id: 'fl-14', title: 'Bulk & Wedding Inquiries', url: '/weddings', isActive: true },
        ],
      },
      {
        id: 'foot-4',
        title: 'Legal & Policies',
        links: [
          { id: 'fl-15', title: 'Terms & Conditions', url: '/policies/terms', isActive: true },
          { id: 'fl-16', title: 'Privacy Policy', url: '/policies/privacy', isActive: true },
          { id: 'fl-17', title: 'Payment Security', url: '/policies/payment', isActive: true },
          { id: 'fl-18', title: 'GST & Compliance', url: '/policies/compliance', isActive: true },
        ],
      },
    ];
  });

  // Footer Modals
  const [isFooterLinkModalOpen, setIsFooterLinkModalOpen] = useState(false);
  const [targetFooterColId, setTargetFooterColId] = useState<string | null>(null);
  const [editingFooterLink, setEditingFooterLink] = useState<{ id?: string; title: string; url: string } | null>(null);

  const [isFooterColModalOpen, setIsFooterColModalOpen] = useState(false);
  const [editingFooterCol, setEditingFooterCol] = useState<{ id?: string; title: string } | null>(null);

  const selectedMenu = menuItems.find((m) => m.id === selectedMenuId) || menuItems[0];

  // Helper to handle typing in Main Menu Tab Label with real-time dynamic Destination URL auto-fill
  const handleTopTitleChange = (newTitle: string) => {
    setEditingTopItem((prev) => {
      const updated: Partial<MegaMenuItem> = { ...prev, title: newTitle };
      if (isTopUrlAutoSync) {
        if (newTitle.trim()) {
          const slug = slugify(newTitle);
          updated.url = `/catalog?category=${slug}`;
        } else {
          updated.url = '/catalog';
        }
      }
      return updated;
    });
  };

  // Helper to handle typing in Column Title with dynamic URL auto-fill
  const handleColumnTitleChange = (newTitle: string) => {
    setEditingColumn((prev) => {
      const updated = { ...prev!, title: newTitle };
      if (isColUrlAutoSync) {
        if (newTitle.trim()) {
          const slug = slugify(newTitle);
          updated.url = `/catalog?category=${slug}`;
        } else {
          updated.url = '/catalog';
        }
      }
      return updated;
    });
  };

  // Helper to handle typing in Sub-item Link with dynamic URL auto-fill
  const handleSubItemTitleChange = (newTitle: string) => {
    setEditingSubItem((prev) => {
      const updated: Partial<SubMenuItem> = { ...prev, title: newTitle };
      if (isSubUrlAutoSync) {
        if (newTitle.trim()) {
          const slug = slugify(newTitle);
          // If a parent menu exists, create category + subcategory route
          const parentCategorySlug = selectedMenu?.url?.includes('category=') 
            ? selectedMenu.url.split('category=')[1]?.split('&')[0] 
            : slugify(selectedMenu?.title || 'catalog');
          
          updated.url = `/catalog?category=${parentCategorySlug}&subcategory=${slug}`;
        } else {
          updated.url = selectedMenu?.url || '/catalog';
        }
      }
      return updated;
    });
  };

  // Quick Preset Click for Top Item
  const handleApplyPresetToTopItem = (label: string, url: string, badge?: string) => {
    setEditingTopItem((prev) => ({
      ...prev,
      title: label,
      url: url,
      badge: badge || prev?.badge || '',
    }));
    setIsTopUrlAutoSync(false);
  };

  const handleToggleActive = async (id: string) => {
    const target = menuItems.find((item) => item.id === id);
    const newStatus = !target?.isActive;
    const updated = menuItems.map((item) =>
      item.id === id ? { ...item, isActive: newStatus } : item
    );
    try {
      await saveMenu(updated).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'menu_update',
        entityType: 'Menu',
        entityId: id,
        entityName: target?.title || 'Menu Tab',
        details: `Toggled header navigation "${target?.title}" to ${newStatus ? 'Active' : 'Hidden'}`,
      });
      toast.success('Navigation tab visibility updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update menu');
    }
  };

  const handleMoveTopItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;

    const newOrder = [...menuItems];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    const reindexed = newOrder.map((item, idx) => ({ ...item, order: idx + 1 }));

    try {
      await saveMenu(reindexed).unwrap();
      toast.success('Navbar menu tabs reordered!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reorder menu items');
    }
  };

  const handleSaveTopItem = async () => {
    if (!editingTopItem?.title?.trim()) {
      toast.error('Menu tab title is required');
      return;
    }

    const finalUrl = (editingTopItem.url?.trim()) || `/catalog?category=${slugify(editingTopItem.title.trim())}`;

    let updatedList: MegaMenuItem[];
    if (editingTopItem.id) {
      updatedList = menuItems.map((m) =>
        m.id === editingTopItem.id ? ({ ...m, ...editingTopItem, url: finalUrl } as MegaMenuItem) : m
      );
    } else {
      const newItem: MegaMenuItem = {
        id: `menu-${Date.now()}`,
        title: editingTopItem.title.trim(),
        url: finalUrl,
        type: (editingTopItem.type as any) || 'mega',
        order: menuItems.length + 1,
        isActive: true,
        badge: editingTopItem.badge || '',
        columns: [
          {
            id: `col-${Date.now()}-1`,
            title: `Popular in ${editingTopItem.title.trim()}`,
            url: finalUrl,
            order: 1,
            items: [
              { 
                id: `sub-${Date.now()}-1`, 
                title: `All ${editingTopItem.title.trim()}`, 
                url: finalUrl, 
                isNew: true, 
                order: 1 
              },
            ],
          },
        ],
        promoCards: [
          {
            id: `promo-${Date.now()}`,
            title: `${editingTopItem.title.trim()} Collection`,
            subtitle: 'Handcrafted Heritage Designs',
            imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
            ctaText: 'Explore Edit',
            linkUrl: finalUrl,
          },
        ],
      };
      updatedList = [...menuItems, newItem];
      setSelectedMenuId(newItem.id);
    }

    try {
      await saveMenu(updatedList).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'menu_update',
        entityType: 'Menu',
        entityId: editingTopItem.id || 'new_tab',
        entityName: editingTopItem.title,
        details: `Saved top header navigation tab "${editingTopItem.title}" with URL "${finalUrl}"`,
      });
      toast.success('Navigation tab saved successfully!');
      setIsTopModalOpen(false);
      setEditingTopItem(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save menu tab');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'topMenu') {
      const updated = menuItems.filter((m) => m.id !== deleteConfirm.id);
      try {
        await saveMenu(updated).unwrap();
        toast.success(`Deleted top tab "${deleteConfirm.title}"`);
        if (selectedMenuId === deleteConfirm.id) setSelectedMenuId(null);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete tab');
      }
    } else if (deleteConfirm.type === 'column') {
      if (!selectedMenu) return;
      const updatedColumns = (selectedMenu.columns || []).filter((c) => c.id !== deleteConfirm.id);
      const updatedMenu = { ...selectedMenu, columns: updatedColumns };
      const updatedList = menuItems.map((m) => (m.id === selectedMenu.id ? updatedMenu : m));
      try {
        await saveMenu(updatedList).unwrap();
        toast.success(`Removed submenu column "${deleteConfirm.title}"`);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete column');
      }
    } else if (deleteConfirm.type === 'subItem') {
      if (!selectedMenu || !deleteConfirm.secondaryId) return;
      const colId = deleteConfirm.secondaryId;
      const updatedColumns = (selectedMenu.columns || []).map((col) => {
        if (col.id !== colId) return col;
        return {
          ...col,
          items: (col.items || []).filter((s) => s.id !== deleteConfirm.id),
        };
      });
      const updatedMenu = { ...selectedMenu, columns: updatedColumns };
      const updatedList = menuItems.map((m) => (m.id === selectedMenu.id ? updatedMenu : m));
      try {
        await saveMenu(updatedList).unwrap();
        toast.success(`Removed sub-item link "${deleteConfirm.title}"`);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete link');
      }
    } else if (deleteConfirm.type === 'promo') {
      if (!selectedMenu) return;
      const updatedPromos = (selectedMenu.promoCards || []).filter((p) => p.id !== deleteConfirm.id);
      const updatedMenu = { ...selectedMenu, promoCards: updatedPromos };
      const updatedList = menuItems.map((m) => (m.id === selectedMenu.id ? updatedMenu : m));
      try {
        await saveMenu(updatedList).unwrap();
        toast.success('Removed promo banner card');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete promo card');
      }
    } else if (deleteConfirm.type === 'footerLink') {
      const colId = deleteConfirm.secondaryId;
      const updated = footerSections.map((sec) => {
        if (sec.id !== colId) return sec;
        return { ...sec, links: sec.links.filter((l) => l.id !== deleteConfirm.id) };
      });
      handleSaveFooter(updated);
      toast.success('Removed footer link');
    } else if (deleteConfirm.type === 'footerColumn') {
      const updated = footerSections.filter((sec) => sec.id !== deleteConfirm.id);
      handleSaveFooter(updated);
      toast.success('Removed footer column');
    }

    setDeleteConfirm(null);
  };

  // Column Handlers
  const handleOpenAddColumn = () => {
    setEditingColumn({ title: '', url: '/catalog' });
    setIsColUrlAutoSync(true);
    setIsColumnModalOpen(true);
  };

  const handleOpenEditColumn = (col: MenuColumn) => {
    setEditingColumn({ id: col.id, title: col.title, url: col.url || '/catalog' });
    setIsColUrlAutoSync(false);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async () => {
    if (!selectedMenu || !editingColumn?.title?.trim()) {
      toast.error('Column title is required');
      return;
    }

    const finalUrl = editingColumn.url.trim() || `/catalog?category=${slugify(editingColumn.title.trim())}`;

    let updatedColumns: MenuColumn[];
    if (editingColumn.id) {
      updatedColumns = (selectedMenu.columns || []).map((c) =>
        c.id === editingColumn.id
          ? { ...c, title: editingColumn.title.trim(), url: finalUrl }
          : c
      );
    } else {
      const newCol: MenuColumn = {
        id: `col-${Date.now()}`,
        title: editingColumn.title.trim(),
        url: finalUrl,
        order: (selectedMenu.columns?.length || 0) + 1,
        items: [],
      };
      updatedColumns = [...(selectedMenu.columns || []), newCol];
    }

    const updatedMenu: MegaMenuItem = { ...selectedMenu, columns: updatedColumns };
    const updatedList = menuItems.map((m) => (m.id === selectedMenu.id ? updatedMenu : m));

    try {
      await saveMenu(updatedList).unwrap();
      toast.success(editingColumn.id ? 'Submenu column updated!' : `Column "${editingColumn.title}" added to mega menu!`);
      setIsColumnModalOpen(false);
      setEditingColumn(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save column');
    }
  };

  const handleMoveColumn = async (colIndex: number, direction: 'left' | 'right') => {
    if (!selectedMenu || !selectedMenu.columns) return;
    const targetIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
    if (targetIndex < 0 || targetIndex >= selectedMenu.columns.length) return;

    const cols = [...selectedMenu.columns];
    const [moved] = cols.splice(colIndex, 1);
    cols.splice(targetIndex, 0, moved);

    const reindexedCols = cols.map((c, idx) => ({ ...c, order: idx + 1 }));
    const updatedMenu = { ...selectedMenu, columns: reindexedCols };
    const updatedList = menuItems.map((m) => (m.id === selectedMenu.id ? updatedMenu : m));

    try {
      await saveMenu(updatedList).unwrap();
      toast.success('Column reordered successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reorder columns');
    }
  };

  // Sub-Item Handlers
  const handleOpenAddSubItem = (columnId: string) => {
    setTargetColumnId(columnId);
    const parentCategorySlug = selectedMenu?.url?.includes('category=') 
      ? selectedMenu.url.split('category=')[1]?.split('&')[0] 
      : slugify(selectedMenu?.title || 'catalog');

    setEditingSubItem({
      title: '',
      url: `/catalog?category=${parentCategorySlug}`,
      badge: '',
      isFeatured: false,
      isNew: false,
    });
    setIsSubUrlAutoSync(true);
    setIsSubModalOpen(true);
  };

  const handleOpenEditSubItem = (columnId: string, sub: SubMenuItem) => {
    setTargetColumnId(columnId);
    setEditingSubItem(sub);
    setIsSubUrlAutoSync(false);
    setIsSubModalOpen(true);
  };

  const handleSaveSubItem = async () => {
    if (!selectedMenu || !targetColumnId || !editingSubItem?.title?.trim()) {
      toast.error('Sub-item link name is required');
      return;
    }

    const finalUrl = editingSubItem.url?.trim() || '/catalog';

    const updatedColumns = (selectedMenu.columns || []).map((col) => {
      if (col.id !== targetColumnId) return col;

      if (editingSubItem.id) {
        return {
          ...col,
          items: (col.items || []).map((item) =>
            item.id === editingSubItem.id
              ? ({
                  ...item,
                  title: editingSubItem.title!.trim(),
                  url: finalUrl,
                  badge: editingSubItem.badge?.trim() || undefined,
                  isFeatured: Boolean(editingSubItem.isFeatured),
                  isNew: Boolean(editingSubItem.isNew),
                } as SubMenuItem)
              : item
          ),
        };
      } else {
        const newSub: SubMenuItem = {
          id: `sub-${Date.now()}`,
          title: editingSubItem.title.trim(),
          url: finalUrl,
          badge: editingSubItem.badge?.trim() || undefined,
          isFeatured: Boolean(editingSubItem.isFeatured),
          isNew: Boolean(editingSubItem.isNew),
          order: (col.items?.length || 0) + 1,
        };
        return {
          ...col,
          items: [...(col.items || []), newSub],
        };
      }
    });

    const updatedMenu = { ...selectedMenu, columns: updatedColumns };
    const updatedList = menuItems.map((m) => (m.id === selectedMenu.id ? updatedMenu : m));

    try {
      await saveMenu(updatedList).unwrap();
      toast.success(editingSubItem.id ? 'Sub-item link updated!' : `Sub-item "${editingSubItem.title}" added!`);
      setIsSubModalOpen(false);
      setEditingSubItem(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save sub-item');
    }
  };

  const handleMoveSubItem = async (colId: string, itemIndex: number, direction: 'up' | 'down') => {
    if (!selectedMenu || !selectedMenu.columns) return;
    const targetCol = selectedMenu.columns.find((c) => c.id === colId);
    if (!targetCol || !targetCol.items) return;

    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= targetCol.items.length) return;

    const items = [...targetCol.items];
    const [moved] = items.splice(itemIndex, 1);
    items.splice(targetIndex, 0, moved);

    const updatedColumns = selectedMenu.columns.map((c) =>
      c.id === colId ? { ...c, items } : c
    );
    const updatedMenu = { ...selectedMenu, columns: updatedColumns };
    const updatedList = menuItems.map((m) => (m.id === selectedMenu.id ? updatedMenu : m));

    try {
      await saveMenu(updatedList).unwrap();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reorder links');
    }
  };

  // Promo Card Handlers
  const handleOpenAddPromo = () => {
    setEditingPromoCard({
      title: 'Special Festive Offer',
      subtitle: 'Exclusive Handcrafted Designs',
      imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      ctaText: 'Shop Collection',
      linkUrl: selectedMenu?.url || '/catalog',
    });
    setIsPromoModalOpen(true);
  };

  const handleOpenEditPromo = (card: MenuPromoCard) => {
    setEditingPromoCard(card);
    setIsPromoModalOpen(true);
  };

  const handleSavePromoCard = async () => {
    if (!selectedMenu || !editingPromoCard?.title?.trim()) {
      toast.error('Promo banner title is required');
      return;
    }

    let updatedPromos: MenuPromoCard[];
    if (editingPromoCard.id) {
      updatedPromos = (selectedMenu.promoCards || []).map((p) =>
        p.id === editingPromoCard.id ? ({ ...p, ...editingPromoCard } as MenuPromoCard) : p
      );
    } else {
      const newCard: MenuPromoCard = {
        id: `promo-${Date.now()}`,
        title: editingPromoCard.title.trim(),
        subtitle: editingPromoCard.subtitle || '',
        imageUrl: editingPromoCard.imageUrl || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
        ctaText: editingPromoCard.ctaText || 'Shop Now',
        linkUrl: editingPromoCard.linkUrl || '/catalog',
      };
      updatedPromos = [...(selectedMenu.promoCards || []), newCard];
    }

    const updatedMenu = { ...selectedMenu, promoCards: updatedPromos };
    const updatedList = menuItems.map((m) => (m.id === selectedMenu.id ? updatedMenu : m));

    try {
      await saveMenu(updatedList).unwrap();
      toast.success('Promo banner card saved!');
      setIsPromoModalOpen(false);
      setEditingPromoCard(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save promo card');
    }
  };

  // Footer Navigation Handlers
  const handleSaveFooter = (sections: any) => {
    setFooterSections(sections);
    try {
      localStorage.setItem('vedaaya_footer_nav_config', JSON.stringify(sections));
      toast.success('Footer navigation menu updated live!');
    } catch {}
  };

  const handleOpenAddFooterLink = (colId: string) => {
    setTargetFooterColId(colId);
    setEditingFooterLink({ title: '', url: '/catalog' });
    setIsFooterLinkModalOpen(true);
  };

  const handleOpenEditFooterLink = (colId: string, link: { id: string; title: string; url: string }) => {
    setTargetFooterColId(colId);
    setEditingFooterLink(link);
    setIsFooterLinkModalOpen(true);
  };

  const handleSaveFooterLink = () => {
    if (!targetFooterColId || !editingFooterLink?.title?.trim()) {
      toast.error('Footer link title is required');
      return;
    }

    const updated = footerSections.map((sec) => {
      if (sec.id !== targetFooterColId) return sec;

      if (editingFooterLink.id) {
        return {
          ...sec,
          links: sec.links.map((l) =>
            l.id === editingFooterLink.id
              ? { ...l, title: editingFooterLink.title.trim(), url: editingFooterLink.url.trim() || '/catalog' }
              : l
          ),
        };
      } else {
        return {
          ...sec,
          links: [
            ...sec.links,
            { id: `fl-${Date.now()}`, title: editingFooterLink.title.trim(), url: editingFooterLink.url.trim() || '/catalog', isActive: true },
          ],
        };
      }
    });

    handleSaveFooter(updated);
    setIsFooterLinkModalOpen(false);
    setEditingFooterLink(null);
  };

  const handleOpenAddFooterColumn = () => {
    setEditingFooterCol({ title: '' });
    setIsFooterColModalOpen(true);
  };

  const handleSaveFooterColumn = () => {
    if (!editingFooterCol?.title?.trim()) {
      toast.error('Column title is required');
      return;
    }

    if (editingFooterCol.id) {
      const updated = footerSections.map((sec) =>
        sec.id === editingFooterCol.id ? { ...sec, title: editingFooterCol.title.trim() } : sec
      );
      handleSaveFooter(updated);
    } else {
      const newCol = {
        id: `foot-${Date.now()}`,
        title: editingFooterCol.title.trim(),
        links: [],
      };
      handleSaveFooter([...footerSections, newCol]);
    }
    setIsFooterColModalOpen(false);
    setEditingFooterCol(null);
  };

  const handleToggleFooterLink = (sectionId: string, linkId: string) => {
    const updated = footerSections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        links: sec.links.map((l) => (l.id === linkId ? { ...l, isActive: !l.isActive } : l)),
      };
    });
    handleSaveFooter(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#7B2435]" />
            Menus & Submenus Builder
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Build, edit, and organize header navbar tabs, multi-column submenus, category filters, and footer navigation links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'header' && (
            <button
              type="button"
              onClick={() => {
                setEditingTopItem({
                  title: '',
                  url: '/catalog',
                  type: 'mega',
                  badge: '',
                  isActive: true,
                });
                setIsTopUrlAutoSync(true);
                setIsTopModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7B2435] hover:bg-[#621C2A] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Main Menu Tab
            </button>
          )}

          {activeTab === 'footer' && (
            <button
              type="button"
              onClick={handleOpenAddFooterColumn}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7B2435] hover:bg-[#621C2A] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Footer Column
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('header')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'header'
              ? 'bg-[#7B2435] text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" /> Header Menus & Submenus
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'footer'
              ? 'bg-[#7B2435] text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <LinkIcon className="w-4 h-4" /> Footer Quick Links & Columns
        </button>
      </div>

      {/* Header & Submenu Editor */}
      {activeTab === 'header' && (
        <>
          {isLoading ? (
            <div className="p-12 text-center text-neutral-400 text-sm">Loading navigation structure from database...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Top Level Menu Tabs */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Header Menu Tabs ({menuItems.length})
                  </h3>
                  <span className="text-[11px] text-neutral-400">Click to edit submenus</span>
                </div>

                <div className="space-y-2">
                  {menuItems.map((m, index) => {
                    const isSelected = (selectedMenu?.id === m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMenuId(m.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'border-[#7B2435] bg-[#7B2435]/5 text-[#7B2435] font-bold shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs truncate">{m.title}</span>
                          {m.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-[#7B2435] text-white shrink-0">
                              {m.badge}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-400 capitalize shrink-0">({m.type})</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Reorder Buttons */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveTopItem(index, 'up')}
                            className="p-1 text-neutral-300 hover:text-neutral-700 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === menuItems.length - 1}
                            onClick={() => handleMoveTopItem(index, 'down')}
                            className="p-1 text-neutral-300 hover:text-neutral-700 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>

                          {/* Active Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(m.id)}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold transition ml-1 cursor-pointer ${
                              m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {m.isActive ? 'Active' : 'Off'}
                          </button>

                          {/* Edit Tab */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTopItem(m);
                              setIsTopUrlAutoSync(false);
                              setIsTopModalOpen(true);
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-800 cursor-pointer ml-1"
                            title="Edit Menu Tab"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Tab */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirm({
                                type: 'topMenu',
                                id: m.id,
                                title: m.title,
                              });
                            }}
                            className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Menu Tab"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Columns: Submenus, Category Columns & Links Editor */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
                {selectedMenu ? (
                  <>
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-neutral-900">{selectedMenu.title}</h3>
                          <span className="text-xs px-2.5 py-0.5 bg-neutral-100 text-neutral-700 rounded-md font-mono flex items-center gap-1 border border-neutral-200">
                            <Compass className="w-3 h-3 text-[#7B2435]" />
                            {selectedMenu.url}
                          </span>
                          {selectedMenu.badge && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                              {selectedMenu.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Navigation Type: <strong className="text-neutral-700 uppercase">{selectedMenu.type}</strong> | Submenu Columns: <strong className="text-neutral-700">{selectedMenu.columns?.length || 0}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedMenu.type === 'mega' && (
                          <>
                            <button
                              type="button"
                              onClick={handleOpenAddColumn}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#7B2435] hover:bg-[#621C2A] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Submenu Column
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenAddPromo}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#EADBDA] text-[#7B2435] border border-[#EADBDA] text-xs font-bold rounded-lg cursor-pointer transition"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              Add Promo Banner
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Non-Mega Menu Notice */}
                    {selectedMenu.type === 'link' && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                        <span>
                          This menu tab is set to <strong>Direct Link</strong>. Clicking it navigates directly to <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">{selectedMenu.url}</code> without opening any dropdown.
                        </span>
                      </div>
                    )}

                    {/* Submenu Columns Grid */}
                    {selectedMenu.type !== 'link' && (
                      <>
                        {(!selectedMenu.columns || selectedMenu.columns.length === 0) ? (
                          <div className="p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                            <Layers className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-neutral-700">No submenu columns configured for &quot;{selectedMenu.title}&quot; yet.</p>
                            <p className="text-[11px] text-neutral-400 mt-1 max-w-md mx-auto">
                              Click &quot;Add Submenu Column&quot; above to create structured category columns (e.g. &quot;Shop By Silhouette&quot;, &quot;Fabric Collections&quot;, &quot;Festive Wear&quot;).
                            </p>
                            <button
                              type="button"
                              onClick={handleOpenAddColumn}
                              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#7B2435] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add First Submenu Column
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedMenu.columns.map((col, colIndex) => (
                              <div key={col.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3 flex flex-col justify-between">
                                <div>
                                  {/* Column Header */}
                                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <ChevronRight className="w-3.5 h-3.5 text-[#7B2435] shrink-0" />
                                      <div className="truncate">
                                        <h4 className="text-xs font-bold text-neutral-900 truncate">{col.title}</h4>
                                        <p className="text-[10px] text-neutral-400 font-mono truncate">{col.url || '/catalog'}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {/* Move column left/right */}
                                      <button
                                        type="button"
                                        disabled={colIndex === 0}
                                        onClick={() => handleMoveColumn(colIndex, 'left')}
                                        className="p-1 text-neutral-300 hover:text-neutral-700 disabled:opacity-20 cursor-pointer"
                                        title="Move Left"
                                      >
                                        <ArrowLeft className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={colIndex === (selectedMenu.columns?.length || 1) - 1}
                                        onClick={() => handleMoveColumn(colIndex, 'right')}
                                        className="p-1 text-neutral-300 hover:text-neutral-700 disabled:opacity-20 cursor-pointer"
                                        title="Move Right"
                                      >
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditColumn(col)}
                                        className="p-1 text-neutral-400 hover:text-neutral-800 cursor-pointer"
                                        title="Edit Column Header"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteConfirm({
                                            type: 'column',
                                            id: col.id,
                                            title: col.title,
                                          });
                                        }}
                                        className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                                        title="Delete Column"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Submenu Links in this Column */}
                                  <div className="space-y-1.5 mt-2.5">
                                    {(!col.items || col.items.length === 0) ? (
                                      <p className="text-[11px] text-neutral-400 italic p-2 text-center">
                                        No links in this submenu column yet.
                                      </p>
                                    ) : (
                                      col.items.map((sub, itemIdx) => (
                                        <div
                                          key={sub.id}
                                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200 text-xs group hover:border-[#7B2435]/40 transition"
                                        >
                                          <div className="flex flex-col truncate pr-2">
                                            <div className="flex items-center gap-1.5 truncate">
                                              <span className="font-medium text-neutral-800 truncate">{sub.title}</span>
                                              {sub.badge && (
                                                <span className="text-[9px] px-1.5 py-0.2 bg-[#7B2435] text-white rounded font-bold shrink-0">
                                                  {sub.badge}
                                                </span>
                                              )}
                                              {sub.isFeatured && (
                                                <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold shrink-0">
                                                  HOT
                                                </span>
                                              )}
                                              {sub.isNew && (
                                                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold shrink-0">
                                                  NEW
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[9px] text-neutral-400 font-mono truncate">{sub.url}</span>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            {/* Reorder up/down within column */}
                                            <button
                                              type="button"
                                              disabled={itemIdx === 0}
                                              onClick={() => handleMoveSubItem(col.id, itemIdx, 'up')}
                                              className="p-0.5 text-neutral-300 hover:text-neutral-700 disabled:opacity-20 cursor-pointer"
                                              title="Move Up"
                                            >
                                              <MoveUp className="w-2.5 h-2.5" />
                                            </button>
                                            <button
                                              type="button"
                                              disabled={itemIdx === col.items.length - 1}
                                              onClick={() => handleMoveSubItem(col.id, itemIdx, 'down')}
                                              className="p-0.5 text-neutral-300 hover:text-neutral-700 disabled:opacity-20 cursor-pointer"
                                              title="Move Down"
                                            >
                                              <MoveDown className="w-2.5 h-2.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditSubItem(col.id, sub)}
                                              className="p-1 text-neutral-400 hover:text-neutral-800 cursor-pointer"
                                              title="Edit Submenu Link"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setDeleteConfirm({
                                                  type: 'subItem',
                                                  id: sub.id,
                                                  secondaryId: col.id,
                                                  title: sub.title,
                                                });
                                              }}
                                              className="p-1 text-neutral-300 hover:text-rose-600 cursor-pointer"
                                              title="Delete Link"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Add link to this column button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddSubItem(col.id)}
                                  className="mt-3 w-full py-1.5 bg-white hover:bg-[#7B2435] text-[#7B2435] hover:text-white border border-dashed border-[#7B2435]/40 rounded-lg cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 transition"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Submenu Link
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Mega Menu Promo Cards Section */}
                        {selectedMenu.promoCards && selectedMenu.promoCards.length > 0 && (
                          <div className="pt-4 border-t border-neutral-100">
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                              Attached Promo Banner Cards ({selectedMenu.promoCards.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedMenu.promoCards.map((promo) => (
                                <div key={promo.id} className="flex gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 items-center">
                                  <img
                                    src={promo.imageUrl}
                                    alt={promo.title}
                                    className="w-16 h-16 rounded-lg object-cover border border-neutral-200 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-neutral-900 truncate">{promo.title}</p>
                                    <p className="text-[11px] text-neutral-500 truncate">{promo.subtitle}</p>
                                    <span className="inline-block mt-1 text-[10px] font-bold text-[#7B2435]">
                                      {promo.ctaText || 'Explore'} →
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditPromo(promo)}
                                      className="p-1 text-neutral-400 hover:text-neutral-800 cursor-pointer"
                                      title="Edit Promo Card"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeleteConfirm({
                                          type: 'promo',
                                          id: promo.id,
                                          title: promo.title,
                                        });
                                      }}
                                      className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                                      title="Delete Promo Card"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center text-neutral-400 text-xs">Select a navigation tab from the left panel.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Quick Links & Columns Manager */}
      {activeTab === 'footer' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Storefront Global Footer Columns</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Customize column titles and customer navigation links appearing in the boutique footer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {footerSections.map((sec) => (
              <div key={sec.id} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <h4 className="text-xs font-bold text-neutral-900">{sec.title}</h4>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFooterCol({ id: sec.id, title: sec.title });
                          setIsFooterColModalOpen(true);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-800 cursor-pointer"
                        title="Rename Column"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirm({
                            type: 'footerColumn',
                            id: sec.id,
                            title: sec.title,
                          });
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-2.5">
                    {sec.links.map((link) => (
                      <div
                        key={link.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs transition ${
                          link.isActive ? 'bg-white border-neutral-200' : 'bg-neutral-100 border-neutral-200 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="font-semibold text-neutral-800 truncate">{link.title}</span>
                          <span className="text-[10px] text-neutral-400 font-mono truncate">{link.url}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleFooterLink(sec.id, link.id)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                            title={link.isActive ? 'Hide Link' : 'Show Link'}
                          >
                            {link.isActive ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditFooterLink(sec.id, link)}
                            className="p-1 text-neutral-400 hover:text-neutral-800 cursor-pointer"
                            title="Edit Link"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirm({
                                type: 'footerLink',
                                id: link.id,
                                secondaryId: sec.id,
                                title: link.title,
                              });
                            }}
                            className="p-1 text-neutral-300 hover:text-rose-600 cursor-pointer"
                            title="Delete Link"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddFooterLink(sec.id)}
                  className="mt-3 w-full py-1.5 bg-white hover:bg-[#7B2435] text-[#7B2435] hover:text-white border border-dashed border-[#7B2435]/40 rounded-lg cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Footer Link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Top Level Menu Modal */}
      {isTopModalOpen && (
        <Modal
          isOpen={isTopModalOpen}
          onClose={() => setIsTopModalOpen(false)}
          title={editingTopItem?.id ? 'Edit Header Menu Tab' : 'Add Main Menu Tab'}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setIsTopModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" isLoading={isSaving} onClick={handleSaveTopItem}>
                Save Menu Tab
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Contextual Explanation of Destination URL */}
            <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EADBDA] text-xs text-neutral-700 flex items-start gap-2.5">
              <Compass className="w-4 h-4 text-[#7B2435] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#7B2435]">What is Destination URL?</strong>
                <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                  The Destination URL is the store link or catalog filter page customers are directed to when they click this tab. As you type a tab name (e.g. <strong>Accessories</strong>), it automatically generates <code className="bg-white px-1.5 py-0.5 rounded border font-mono text-[#7B2435]">/catalog?category=accessories</code>.
                </p>
              </div>
            </div>

            {/* Quick Category / Page Presets */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Quick Presets (Click to Auto-Fill):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => handleApplyPresetToTopItem('Accessories', '/catalog?category=accessories', 'NEW')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#7B2435] hover:text-white text-neutral-700 border border-neutral-200 rounded-lg transition cursor-pointer"
                >
                  + Accessories
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetToTopItem('Kurtis & Tunics', '/catalog?category=kurtis')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#7B2435] hover:text-white text-neutral-700 border border-neutral-200 rounded-lg transition cursor-pointer"
                >
                  + Kurtis & Tunics
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetToTopItem('Anarkali Sets', '/catalog?category=anarkali-sets', 'HOT')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#7B2435] hover:text-white text-neutral-700 border border-neutral-200 rounded-lg transition cursor-pointer"
                >
                  + Anarkali Sets
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetToTopItem('Sarees & Drapes', '/catalog?category=sarees')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#7B2435] hover:text-white text-neutral-700 border border-neutral-200 rounded-lg transition cursor-pointer"
                >
                  + Sarees & Drapes
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetToTopItem('Festive Edit', '/catalog?collection=festive', '30% OFF')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#7B2435] hover:text-white text-neutral-700 border border-neutral-200 rounded-lg transition cursor-pointer"
                >
                  + Festive Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetToTopItem('Plus Size (XL-5XL)', '/catalog?category=plus-size')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#7B2435] hover:text-white text-neutral-700 border border-neutral-200 rounded-lg transition cursor-pointer"
                >
                  + Plus Size
                </button>
                {dbCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleApplyPresetToTopItem(c.name, `/catalog?category=${c.slug}`)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#7B2435] hover:text-white text-neutral-700 border border-neutral-200 rounded-lg transition cursor-pointer"
                  >
                    + {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Tab Label */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Main Menu Tab Label *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Accessories or Anarkali Suits"
                value={editingTopItem?.title || ''}
                onChange={(e) => handleTopTitleChange(e.target.value)}
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white font-medium"
              />
            </div>

            {/* Destination URL with Auto-sync indicator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-700">
                  Destination URL *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newSync = !isTopUrlAutoSync;
                    setIsTopUrlAutoSync(newSync);
                    if (newSync && editingTopItem?.title) {
                      setEditingTopItem((p) => ({
                        ...p,
                        url: `/catalog?category=${slugify(p?.title || '')}`,
                      }));
                    }
                  }}
                  className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                    isTopUrlAutoSync ? 'text-[#7B2435]' : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                  title="Click to toggle auto-sync with Label"
                >
                  <RefreshCw className={`w-3 h-3 ${isTopUrlAutoSync ? 'animate-spin-slow text-[#7B2435]' : ''}`} />
                  {isTopUrlAutoSync ? 'Auto-syncing from Label' : 'Manual URL (click to auto-sync)'}
                </button>
              </div>
              <input
                type="text"
                placeholder="/catalog?category=accessories"
                value={editingTopItem?.url || ''}
                onChange={(e) => {
                  setIsTopUrlAutoSync(false);
                  setEditingTopItem((p) => ({ ...p, url: e.target.value }));
                }}
                className="w-full text-xs p-3 font-mono border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Navigation Type</label>
                <select
                  value={editingTopItem?.type || 'mega'}
                  onChange={(e) => setEditingTopItem((p) => ({ ...p, type: e.target.value as any }))}
                  className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
                >
                  <option value="mega">Multi-Column Mega Menu</option>
                  <option value="dropdown">Standard Dropdown</option>
                  <option value="link">Direct Link (No Dropdown)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Highlight Badge (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. HOT, NEW, 30% OFF"
                  value={editingTopItem?.badge || ''}
                  onChange={(e) => setEditingTopItem((p) => ({ ...p, badge: e.target.value }))}
                  className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Submenu Column Modal */}
      {isColumnModalOpen && (
        <Modal
          isOpen={isColumnModalOpen}
          onClose={() => setIsColumnModalOpen(false)}
          title={editingColumn?.id ? 'Edit Submenu Column' : 'Add Submenu Column'}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setIsColumnModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveColumn}>
                Save Column
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Column Header Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shop By Silhouette, Jewellery & Accessories"
                value={editingColumn?.title || ''}
                onChange={(e) => handleColumnTitleChange(e.target.value)}
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-700">
                  Category Landing URL
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newSync = !isColUrlAutoSync;
                    setIsColUrlAutoSync(newSync);
                    if (newSync && editingColumn?.title) {
                      setEditingColumn((p) => ({ ...p!, url: `/catalog?category=${slugify(p!.title)}` }));
                    }
                  }}
                  className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                    isColUrlAutoSync ? 'text-[#7B2435]' : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isColUrlAutoSync ? 'animate-spin-slow text-[#7B2435]' : ''}`} />
                  {isColUrlAutoSync ? 'Auto-syncing URL' : 'Manual URL'}
                </button>
              </div>
              <input
                type="text"
                placeholder="/catalog?category=accessories"
                value={editingColumn?.url || ''}
                onChange={(e) => {
                  setIsColUrlAutoSync(false);
                  setEditingColumn((p) => ({ ...p!, url: e.target.value }));
                }}
                className="w-full text-xs p-3 font-mono border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Sub-Item Link Modal */}
      {isSubModalOpen && (
        <Modal
          isOpen={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          title={editingSubItem?.id ? 'Edit Submenu Link' : 'Add Submenu Link'}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setIsSubModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveSubItem}>
                Save Submenu Link
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Submenu Link Label *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Oxidised Jhumkas, Potli Bags, Chanderi Kurti"
                value={editingSubItem?.title || ''}
                onChange={(e) => handleSubItemTitleChange(e.target.value)}
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-700">
                  Destination Catalog URL *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newSync = !isSubUrlAutoSync;
                    setIsSubUrlAutoSync(newSync);
                    if (newSync && editingSubItem?.title) {
                      const parentCat = selectedMenu?.url?.includes('category=') 
                        ? selectedMenu.url.split('category=')[1]?.split('&')[0] 
                        : slugify(selectedMenu?.title || 'catalog');
                      setEditingSubItem((p) => ({
                        ...p,
                        url: `/catalog?category=${parentCat}&subcategory=${slugify(p?.title || '')}`,
                      }));
                    }
                  }}
                  className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                    isSubUrlAutoSync ? 'text-[#7B2435]' : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isSubUrlAutoSync ? 'animate-spin-slow text-[#7B2435]' : ''}`} />
                  {isSubUrlAutoSync ? 'Auto-syncing URL' : 'Manual URL'}
                </button>
              </div>
              <input
                type="text"
                placeholder="/catalog?category=accessories&subcategory=jhumkas"
                value={editingSubItem?.url || ''}
                onChange={(e) => {
                  setIsSubUrlAutoSync(false);
                  setEditingSubItem((p) => ({ ...p, url: e.target.value }));
                }}
                className="w-full text-xs p-3 font-mono border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Badge / Highlight (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Best Seller, Pure Handloom"
                value={editingSubItem?.badge || ''}
                onChange={(e) => setEditingSubItem((p) => ({ ...p, badge: e.target.value }))}
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSubItem?.isFeatured || false}
                  onChange={(e) => setEditingSubItem((p) => ({ ...p, isFeatured: e.target.checked }))}
                  className="w-4 h-4 accent-[#7B2435]"
                />
                <span>Highlight as Featured / HOT</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSubItem?.isNew || false}
                  onChange={(e) => setEditingSubItem((p) => ({ ...p, isNew: e.target.checked }))}
                  className="w-4 h-4 accent-[#7B2435]"
                />
                <span>Mark as NEW</span>
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Promo Card Modal */}
      {isPromoModalOpen && (
        <Modal
          isOpen={isPromoModalOpen}
          onClose={() => setIsPromoModalOpen(false)}
          title={editingPromoCard?.id ? 'Edit Promo Banner Card' : 'Add Promo Banner Card'}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setIsPromoModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSavePromoCard}>
                Save Promo Banner
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Banner Title *"
              required
              placeholder="e.g. Festive Handloom Edit"
              value={editingPromoCard?.title || ''}
              onChange={(e) => setEditingPromoCard((p) => ({ ...p, title: e.target.value }))}
            />

            <Input
              label="Subtitle / Offer text"
              placeholder="e.g. Up to 30% Off New Kurtas"
              value={editingPromoCard?.subtitle || ''}
              onChange={(e) => setEditingPromoCard((p) => ({ ...p, subtitle: e.target.value }))}
            />

            <Input
              label="Image URL"
              placeholder="https://images.unsplash.com/..."
              value={editingPromoCard?.imageUrl || ''}
              onChange={(e) => setEditingPromoCard((p) => ({ ...p, imageUrl: e.target.value }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Destination Link"
                placeholder="/catalog?collection=festive"
                value={editingPromoCard?.linkUrl || ''}
                onChange={(e) => setEditingPromoCard((p) => ({ ...p, linkUrl: e.target.value }))}
              />
              <Input
                label="Button CTA Text"
                placeholder="e.g. Explore Now"
                value={editingPromoCard?.ctaText || ''}
                onChange={(e) => setEditingPromoCard((p) => ({ ...p, ctaText: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Footer Link Modal */}
      {isFooterLinkModalOpen && (
        <Modal
          isOpen={isFooterLinkModalOpen}
          onClose={() => setIsFooterLinkModalOpen(false)}
          title={editingFooterLink?.id ? 'Edit Footer Link' : 'Add Footer Link'}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setIsFooterLinkModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveFooterLink}>
                Save Link
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Link Title *"
              required
              placeholder="e.g. Size & Fit Guide"
              value={editingFooterLink?.title || ''}
              onChange={(e) => setEditingFooterLink((p) => ({ ...p!, title: e.target.value }))}
            />
            <Input
              label="Destination URL *"
              placeholder="/size-guide"
              value={editingFooterLink?.url || ''}
              onChange={(e) => setEditingFooterLink((p) => ({ ...p!, url: e.target.value }))}
            />
          </div>
        </Modal>
      )}

      {/* Footer Column Modal */}
      {isFooterColModalOpen && (
        <Modal
          isOpen={isFooterColModalOpen}
          onClose={() => setIsFooterColModalOpen(false)}
          title={editingFooterCol?.id ? 'Rename Footer Column' : 'Add Footer Column'}
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setIsFooterColModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveFooterColumn}>
                Save Column
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Column Heading *"
              required
              placeholder="e.g. Boutique Services"
              value={editingFooterCol?.title || ''}
              onChange={(e) => setEditingFooterCol((p) => ({ ...p!, title: e.target.value }))}
            />
          </div>
        </Modal>
      )}

      {/* Deletion Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          isOpen={Boolean(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          title="Confirm Deletion"
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-neutral-700">
              Are you sure you want to delete <strong className="text-neutral-900">&quot;{deleteConfirm.title}&quot;</strong>?
            </p>
            {deleteConfirm.type === 'topMenu' && (
              <p className="text-[11px] text-rose-600">
                This will also remove all submenu columns and links associated with this main menu tab.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

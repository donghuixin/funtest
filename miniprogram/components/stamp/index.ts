import { guestView } from '../../services/content';

Component({
  properties: {
    guest: { type: String, value: 'xufei' },
    size: { type: String, value: 'md' }, // sm | md | lg
  },
  data: { color: '#A63D40', icon: 'key', type: '' },
  observers: {
    guest(id: string) {
      if (!id) return;
      const g = guestView(id);
      this.setData({ color: g.color, icon: g.icon, type: g.type });
    },
  },
});

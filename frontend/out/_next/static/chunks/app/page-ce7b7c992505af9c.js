(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [931],
  {
    9410: function (e, t, s) {
      Promise.resolve().then(s.bind(s, 5567));
    },
    5567: function (e, t, s) {
      'use strict';
      (s.r(t),
        s.d(t, {
          default: function () {
            return F;
          },
        }));
      var a = s(7437),
        n = s(2265),
        o = s(2815),
        l = s(5626),
        i = s(2549),
        r = s(9883),
        c = s(1827),
        d = s(9865),
        m = s(2369),
        x = s(9534),
        h = s(1274),
        g = s(3589),
        u = s(890),
        f = s(4737);
      async function p(e, t) {
        console.log('[API] createConversation: Sending POST to /api/conversations/', {
          user_id: e,
          title: t,
        });
        let s = await fetch('http://localhost:8000/api/conversations/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: e, title: t }),
        });
        if (!s.ok)
          throw (
            console.error('[API] createConversation: Failed', s.status, s.statusText),
            Error('Create conversation failed')
          );
        let a = await s.json();
        return (console.log('[API] createConversation: Success', a), a);
      }
      async function v(e) {
        console.log('[API] listConversations: Sending GET to /api/conversations/', { user_id: e });
        let t = await fetch('http://localhost:8000/api/conversations/?user_id='.concat(e));
        if (!t.ok)
          throw (
            console.error('[API] listConversations: Failed', t.status, t.statusText),
            Error('List conversations failed')
          );
        let s = await t.json();
        return (console.log('[API] listConversations: Success', s), s);
      }
      async function w(e, t, s) {
        console.log('[API] chatWithLLM: Sending POST to /api/chat/', {
          conversation_id: e,
          user_id: t,
          content: s,
        });
        let a = await fetch('http://localhost:8000/api/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: e, user_id: t, content: s }),
        });
        if (!a.ok)
          throw (
            console.error('[API] chatWithLLM: Failed', a.status, a.statusText),
            Error('Chat failed')
          );
        let n = await a.json();
        return (console.log('[API] chatWithLLM: Success', n), n);
      }
      async function b(e) {
        console.log('[API] getMessages: Sending GET to /api/conversations/' + e + '/messages');
        let t = await fetch('http://localhost:8000/api/conversations/'.concat(e, '/messages'));
        if (!t.ok)
          throw (
            console.error('[API] getMessages: Failed', t.status, t.statusText),
            Error('Get messages failed')
          );
        let s = await t.json(),
          a = s.map(e => ({ ...e, id: e.id || e._id, timestamp: e.created_at })),
          n = a.sort((e, t) => new Date(e.timestamp).getTime() - new Date(t.timestamp).getTime());
        return (console.log('[API] getMessages: Success', n), n);
      }
      async function y(e) {
        console.log('[API] deleteConversation: Sending DELETE to /api/conversations/' + e);
        let t = await fetch('http://localhost:8000/api/conversations/'.concat(e), {
          method: 'DELETE',
        });
        if (!t.ok)
          throw (
            console.error('[API] deleteConversation: Failed', t.status, t.statusText),
            Error('Delete conversation failed')
          );
        let s = await t.json();
        return (console.log('[API] deleteConversation: Success', s), s);
      }
      async function j(e, t) {
        console.log('[API] renameConversation: Sending PATCH to /api/conversations/' + e);
        let s = await fetch('http://localhost:8000/api/conversations/'.concat(e), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: t }),
        });
        if (!s.ok)
          throw (
            console.error('[API] renameConversation: Failed', s.status, s.statusText),
            Error('Rename conversation failed')
          );
        let a = await s.json();
        return (console.log('[API] renameConversation: Success', a), a);
      }
      var N = s(4887);
      function C(e) {
        let {
            isOpen: t,
            onToggle: s,
            chats: p,
            currentChatId: v,
            onSelectChat: w,
            onNewChat: b,
            onDeleteChat: C,
            onRenameChat: S,
            onShowWelcome: k,
            disableInteraction: T = !1,
          } = e,
          [I, E] = (0, n.useState)(''),
          [A, P] = (0, n.useState)(null),
          [R, Z] = (0, n.useState)(null),
          [L, _] = (0, n.useState)(''),
          [M, O] = (0, n.useState)(null),
          D = (0, n.useRef)([]),
          F = (0, n.useRef)(null);
        ((0, n.useEffect)(() => {
          t &&
            o.p8.fromTo(
              '.sidebar-item',
              { opacity: 0, x: -20 },
              { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
            );
        }, [t]),
          (0, n.useEffect)(() => {
            if (A)
              return (
                document.addEventListener('mousedown', e),
                () => {
                  document.removeEventListener('mousedown', e);
                }
              );
            function e(e) {
              F.current && !F.current.contains(e.target) && (P(null), O(null));
            }
          }, [A]));
        let z = p.filter(e => e.title.toLowerCase().includes(I.toLowerCase())),
          U = e => {
            let t = p.find(t => t.id === e);
            (t && (Z(e), _(t.title)), P(null));
          },
          H = async e => {
            if (L.trim())
              try {
                (await j(e, L.trim()), S(e, L.trim()));
              } catch (e) {}
            (Z(null), _(''));
          },
          G = () => {
            (Z(null), _(''));
          },
          K = e => {
            let t = new Date(),
              s = t.getTime() - e.getTime(),
              a = Math.floor(s / 864e5);
            return 0 === a
              ? 'today'
              : 1 === a
                ? 'yesterday'
                : a < 7
                  ? ''.concat(a, ' days ago')
                  : e.toLocaleDateString().toLowerCase();
          };
        return (0, a.jsxs)(a.Fragment, {
          children: [
            t &&
              (0, a.jsx)('div', {
                className: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden',
                onClick: s,
              }),
            (0, a.jsxs)('div', {
              className: '\n        '.concat(
                t ? 'translate-x-0' : '-translate-x-full',
                ' \n        fixed lg:relative lg:translate-x-0\n        w-[280px] h-full sidebar-mist\n        transition-transform duration-500 ease-out z-50\n        flex flex-col\n      '
              ),
              children: [
                (0, a.jsxs)('div', {
                  className: 'p-4 border-b border-mist',
                  children: [
                    (0, a.jsxs)('div', {
                      className: 'flex items-center justify-between mb-4 sidebar-item',
                      children: [
                        (0, a.jsxs)('div', {
                          className: 'flex items-center gap-3',
                          children: [
                            (0, a.jsx)('div', {
                              className:
                                'w-8 h-8 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-lg flex items-center justify-center border border-pale-cyan/20',
                              children: (0, a.jsx)(l.Z, { className: 'w-4 h-4 text-cyan' }),
                            }),
                            (0, a.jsx)('span', {
                              className: 'text-sm font-light text-mist tracking-wide',
                              children: 'Genesis',
                            }),
                          ],
                        }),
                        (0, a.jsx)('button', {
                          onClick: s,
                          className:
                            'lg:hidden p-2 hover:bg-mist-medium/50 rounded-lg transition-colors',
                          children: (0, a.jsx)(i.Z, { className: 'w-4 h-4 text-fog' }),
                        }),
                      ],
                    }),
                    (0, a.jsxs)('button', {
                      onClick: b,
                      className:
                        'w-full vapor-button rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-light lowercase tracking-wide sidebar-item hover-glow',
                      children: [
                        (0, a.jsx)(r.Z, { className: 'w-4 h-4 text-cyan' }),
                        (0, a.jsx)('span', {
                          className: 'text-mist',
                          children: 'new conversation',
                        }),
                      ],
                    }),
                  ],
                }),
                (0, a.jsx)('div', {
                  className: 'p-4 border-b border-mist',
                  children: (0, a.jsxs)('div', {
                    className: 'relative sidebar-item',
                    children: [
                      (0, a.jsx)(c.Z, {
                        className:
                          'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fog',
                      }),
                      (0, a.jsx)('input', {
                        type: 'text',
                        placeholder: 'search conversations...',
                        value: I,
                        onChange: e => E(e.target.value),
                        className:
                          'w-full pl-10 pr-3 py-3 mist-input rounded-xl text-sm font-light lowercase tracking-wide',
                      }),
                    ],
                  }),
                }),
                (0, a.jsx)('div', {
                  className: 'p-4 border-b border-mist',
                  children: (0, a.jsxs)('button', {
                    onClick: k,
                    className:
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-mist-medium/30 transition-colors sidebar-item',
                    children: [
                      (0, a.jsx)(d.Z, { className: 'w-4 h-4 text-fog' }),
                      (0, a.jsx)('span', {
                        className: 'text-sm text-fog font-light lowercase tracking-wide',
                        children: 'knowledge base',
                      }),
                    ],
                  }),
                }),
                (0, a.jsx)('div', {
                  className: 'flex-1 overflow-y-auto',
                  children: (0, a.jsxs)('div', {
                    className: 'p-4',
                    children: [
                      (0, a.jsx)('h3', {
                        className:
                          'text-xs font-light text-fog uppercase tracking-widest mb-4 sidebar-item',
                        children: 'conversations',
                      }),
                      0 === z.length
                        ? (0, a.jsxs)('div', {
                            className: 'text-center py-12 sidebar-item',
                            children: [
                              (0, a.jsx)('div', {
                                className:
                                  'w-16 h-16 bg-gradient-to-br from-pale-cyan/10 to-transparent rounded-full mx-auto mb-4 flex items-center justify-center',
                                children: (0, a.jsx)(m.Z, { className: 'w-6 h-6 text-fog' }),
                              }),
                              (0, a.jsx)('p', {
                                className: 'text-sm text-fog font-light lowercase',
                                children: 'no conversations yet',
                              }),
                              (0, a.jsx)('p', {
                                className: 'text-xs text-fog/60 mt-1 lowercase',
                                children: 'begin your digital journey',
                              }),
                            ],
                          })
                        : (0, a.jsx)('div', {
                            className: 'space-y-2',
                            children: z.map((e, t) =>
                              (0, a.jsxs)(
                                'div',
                                {
                                  className:
                                    '\n                        group relative rounded-xl transition-all duration-300 sidebar-item entrance-haze\n                        '
                                      .concat(
                                        v === e.id ? 'mist-card' : 'hover:bg-mist-medium/20',
                                        '\n                        '
                                      )
                                      .concat(
                                        T ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                                        '\n                        z-0\n                      '
                                      ),
                                  style: { animationDelay: ''.concat(0.1 * t, 's') },
                                  children: [
                                    (0, a.jsx)('div', {
                                      className: 'p-4 pr-10',
                                      onClick: () => !T && w(e.id),
                                      children:
                                        R === e.id
                                          ? (0, a.jsx)('input', {
                                              type: 'text',
                                              value: L,
                                              onChange: e => _(e.target.value),
                                              onBlur: () => H(e.id),
                                              onKeyDown: t => {
                                                ('Enter' === t.key && H(e.id),
                                                  'Escape' === t.key && G());
                                              },
                                              className:
                                                'w-full text-sm font-light text-mist bg-transparent border-none outline-none lowercase',
                                              autoFocus: !0,
                                            })
                                          : (0, a.jsxs)(a.Fragment, {
                                              children: [
                                                (0, a.jsx)('h4', {
                                                  className:
                                                    'text-sm font-light text-mist truncate lowercase',
                                                  children: e.title,
                                                }),
                                                e.lastMessage &&
                                                  (0, a.jsx)('p', {
                                                    className:
                                                      'text-xs text-fog mt-2 lowercase font-light',
                                                    children: K(e.lastMessage),
                                                  }),
                                              ],
                                            }),
                                    }),
                                    (0, a.jsxs)('div', {
                                      className: 'absolute top-3 right-3',
                                      children: [
                                        (0, a.jsx)('button', {
                                          ref: e => (D.current[t] = e),
                                          onClick: s => {
                                            if ((s.stopPropagation(), A === e.id))
                                              (P(null), O(null));
                                            else {
                                              var a;
                                              P(e.id);
                                              let s =
                                                null === (a = D.current[t]) || void 0 === a
                                                  ? void 0
                                                  : a.getBoundingClientRect();
                                              s &&
                                                O({
                                                  top: s.bottom + window.scrollY + 4,
                                                  left: s.left + window.scrollX - 160 + s.width,
                                                });
                                            }
                                          },
                                          className:
                                            'opacity-0 group-hover:opacity-100 p-2 hover:bg-mist-medium/50 rounded-lg transition-all duration-300',
                                          children: (0, a.jsx)(x.Z, {
                                            className: 'w-4 h-4 text-fog',
                                          }),
                                        }),
                                        A === e.id &&
                                          M &&
                                          (0, N.createPortal)(
                                            (0, a.jsxs)('div', {
                                              ref: F,
                                              className:
                                                'fixed w-48 mist-card rounded-xl py-2 z-[10000] entrance-haze shadow-lg',
                                              style: { top: M.top, left: M.left },
                                              children: [
                                                (0, a.jsxs)('button', {
                                                  onClick: () => {
                                                    (P(null), O(null));
                                                  },
                                                  className:
                                                    'w-full flex items-center gap-3 px-4 py-2 text-sm text-fog hover:text-mist hover:bg-mist-medium/30 transition-colors lowercase font-light',
                                                  children: [
                                                    (0, a.jsx)(h.Z, { className: 'w-4 h-4' }),
                                                    'share',
                                                  ],
                                                }),
                                                (0, a.jsxs)('button', {
                                                  onClick: () => U(e.id),
                                                  className:
                                                    'w-full flex items-center gap-3 px-4 py-2 text-sm text-fog hover:text-mist hover:bg-mist-medium/30 transition-colors lowercase font-light',
                                                  children: [
                                                    (0, a.jsx)(g.Z, { className: 'w-4 h-4' }),
                                                    'rename',
                                                  ],
                                                }),
                                                (0, a.jsxs)('button', {
                                                  onClick: () => {
                                                    (P(null), O(null));
                                                  },
                                                  className:
                                                    'w-full flex items-center gap-3 px-4 py-2 text-sm text-fog hover:text-mist hover:bg-mist-medium/30 transition-colors lowercase font-light',
                                                  children: [
                                                    (0, a.jsx)(u.Z, { className: 'w-4 h-4' }),
                                                    'archive',
                                                  ],
                                                }),
                                                (0, a.jsxs)('button', {
                                                  onClick: async () => {
                                                    (await y(e.id), C(e.id), P(null), O(null));
                                                  },
                                                  className:
                                                    'w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors lowercase font-light',
                                                  children: [
                                                    (0, a.jsx)(f.Z, { className: 'w-4 h-4' }),
                                                    'delete',
                                                  ],
                                                }),
                                              ],
                                            }),
                                            document.body
                                          ),
                                      ],
                                    }),
                                  ],
                                },
                                e.id
                              )
                            ),
                          }),
                    ],
                  }),
                }),
              ],
            }),
          ],
        });
      }
      var S = s(8004),
        k = s(6224),
        T = s(9868),
        I = s(4658),
        E = s(3714),
        A = s(4043),
        P = s(6020);
      function R(e) {
        let { chat: t, onSendMessage: s, onToggleSidebar: l, loading: i } = e,
          r = (0, n.useRef)(null),
          [c, d] = n.useState(''),
          x = () => {
            var e;
            null === (e = r.current) || void 0 === e || e.scrollIntoView({ behavior: 'smooth' });
          };
        ((0, n.useEffect)(() => {
          x();
        }, [null == t ? void 0 : t.messages]),
          (0, n.useEffect)(() => {
            let e = document.querySelectorAll('.message-item:last-child');
            e.length > 0 &&
              o.p8.fromTo(
                e,
                { opacity: 0, y: 20, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' }
              );
          }, [null == t ? void 0 : t.messages]));
        let h = () => {
            c.trim() && (s(c.trim()), d(''));
          },
          g = e => {
            let t = 'string' == typeof e ? new Date(e) : e;
            return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
          },
          u = e => {
            navigator.clipboard.writeText(e);
          };
        return (0, a.jsxs)('div', {
          className: 'flex-1 flex flex-col',
          children: [
            (0, a.jsxs)('div', {
              className: 'flex items-center justify-between p-4 border-b border-mist lg:hidden',
              children: [
                (0, a.jsx)('button', {
                  onClick: l,
                  className: 'p-2 hover:bg-mist-medium/30 rounded-lg transition-colors',
                  children: (0, a.jsx)(S.Z, { className: 'w-5 h-5 text-fog' }),
                }),
                (0, a.jsx)('h1', {
                  className: 'font-light text-mist truncate lowercase tracking-wide',
                  children: (null == t ? void 0 : t.title) || 'new conversation',
                }),
                (0, a.jsx)('div', { className: 'w-9' }),
              ],
            }),
            (0, a.jsx)('div', {
              className: 'flex-1 overflow-y-auto',
              children:
                (null == t ? void 0 : t.messages.length) === 0
                  ? i
                    ? (0, a.jsx)('div', {
                        className: 'flex items-center justify-center h-full',
                        children: (0, a.jsx)('div', {
                          className:
                            'w-16 h-16 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin',
                        }),
                      })
                    : (0, a.jsx)('div', {
                        className: 'flex items-center justify-center h-full',
                        children: (0, a.jsxs)('div', {
                          className: 'text-center',
                          children: [
                            (0, a.jsx)('div', {
                              className:
                                'w-16 h-16 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-pale-cyan/20',
                              children: (0, a.jsx)(m.Z, { className: 'w-8 h-8 text-cyan' }),
                            }),
                            (0, a.jsx)('p', {
                              className: 'text-fog font-light lowercase tracking-wide',
                              children: 'begin the conversation',
                            }),
                          ],
                        }),
                      })
                  : (0, a.jsxs)('div', {
                      className: 'max-w-4xl mx-auto px-6 py-8',
                      children: [
                        null == t
                          ? void 0
                          : t.messages
                              .filter(e => e && e.id)
                              .map((e, t) =>
                                (0, a.jsx)(
                                  'div',
                                  {
                                    className: 'mb-8 message-item',
                                    children:
                                      'assistant' === e.role
                                        ? (0, a.jsxs)('div', {
                                            className: 'flex gap-4',
                                            children: [
                                              (0, a.jsx)('div', {
                                                className:
                                                  'w-10 h-10 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-pale-cyan/20',
                                                children: (0, a.jsx)(m.Z, {
                                                  className: 'w-5 h-5 text-cyan',
                                                }),
                                              }),
                                              (0, a.jsxs)('div', {
                                                className: 'flex-1',
                                                children: [
                                                  (0, a.jsx)('div', {
                                                    className: 'message-bubble-ai rounded-2xl p-6',
                                                    children: (0, a.jsx)('p', {
                                                      className:
                                                        'text-mist leading-relaxed whitespace-pre-wrap font-light tracking-wide',
                                                      children: e.content,
                                                    }),
                                                  }),
                                                  (0, a.jsxs)('div', {
                                                    className:
                                                      'flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity',
                                                    children: [
                                                      (0, a.jsx)('button', {
                                                        onClick: () => u(e.content),
                                                        className:
                                                          'p-2 hover:bg-mist-medium/30 rounded-lg transition-colors hover-glow',
                                                        title: 'copy',
                                                        children: (0, a.jsx)(k.Z, {
                                                          className:
                                                            'w-4 h-4 text-fog hover:text-cyan transition-colors',
                                                        }),
                                                      }),
                                                      (0, a.jsx)('button', {
                                                        className:
                                                          'p-2 hover:bg-mist-medium/30 rounded-lg transition-colors hover-glow',
                                                        title: 'good response',
                                                        children: (0, a.jsx)(T.Z, {
                                                          className:
                                                            'w-4 h-4 text-fog hover:text-cyan transition-colors',
                                                        }),
                                                      }),
                                                      (0, a.jsx)('button', {
                                                        className:
                                                          'p-2 hover:bg-mist-medium/30 rounded-lg transition-colors hover-glow',
                                                        title: 'poor response',
                                                        children: (0, a.jsx)(I.Z, {
                                                          className:
                                                            'w-4 h-4 text-fog hover:text-cyan transition-colors',
                                                        }),
                                                      }),
                                                      (0, a.jsx)('span', {
                                                        className:
                                                          'text-xs text-fog ml-3 font-light lowercase',
                                                        children: g(e.timestamp),
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            ],
                                          })
                                        : (0, a.jsx)('div', {
                                            className: 'flex justify-end',
                                            children: (0, a.jsxs)('div', {
                                              className: 'max-w-[75%]',
                                              children: [
                                                (0, a.jsx)('div', {
                                                  className:
                                                    'message-bubble-user rounded-2xl px-6 py-4',
                                                  children: (0, a.jsx)('p', {
                                                    className:
                                                      'text-mist leading-relaxed whitespace-pre-wrap font-light tracking-wide',
                                                    children: e.content,
                                                  }),
                                                }),
                                                (0, a.jsx)('div', {
                                                  className: 'text-right mt-2',
                                                  children: (0, a.jsx)('span', {
                                                    className:
                                                      'text-xs text-fog font-light lowercase',
                                                    children: g(e.timestamp),
                                                  }),
                                                }),
                                              ],
                                            }),
                                          }),
                                  },
                                  e.id
                                )
                              ),
                        t &&
                          Array.isArray(t.messages) &&
                          t.messages.length > 0 &&
                          i &&
                          (0, a.jsxs)('div', {
                            className: 'flex gap-4 mb-8 message-item',
                            children: [
                              (0, a.jsx)('div', {
                                className:
                                  'w-10 h-10 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-pale-cyan/20',
                                children: (0, a.jsx)('div', {
                                  className:
                                    'w-6 h-6 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin',
                                }),
                              }),
                              (0, a.jsx)('div', {
                                className: 'flex-1',
                                children: (0, a.jsx)('div', {
                                  className: 'message-bubble-ai rounded-2xl p-6',
                                  children: (0, a.jsxs)('div', {
                                    className: 'flex items-center gap-3',
                                    children: [
                                      (0, a.jsx)('div', { className: 'loading-swirl' }),
                                      (0, a.jsx)('span', {
                                        className: 'text-fog font-light lowercase tracking-wide',
                                        children: 'consciousness emerging...',
                                      }),
                                    ],
                                  }),
                                }),
                              }),
                            ],
                          }),
                        (0, a.jsx)('div', { ref: r }),
                      ],
                    }),
            }),
            (0, a.jsx)('div', {
              className: 'border-t border-mist p-6',
              children: (0, a.jsxs)('div', {
                className: 'max-w-4xl mx-auto',
                children: [
                  (0, a.jsxs)('div', {
                    className:
                      'relative flex items-end mist-card rounded-2xl p-2 focus-within:border-pale-cyan/40 transition-all duration-300',
                    children: [
                      (0, a.jsx)('button', {
                        className: 'p-3 text-fog hover:text-cyan transition-colors',
                        children: (0, a.jsx)(E.Z, { className: 'w-5 h-5' }),
                      }),
                      (0, a.jsx)('textarea', {
                        value: c,
                        onChange: e => d(e.target.value),
                        onKeyDown: e => {
                          'Enter' !== e.key || e.shiftKey || (e.preventDefault(), h());
                        },
                        placeholder: 'Continue the dialogue...',
                        className:
                          'flex-1 resize-none border-none outline-none py-3 bg-transparent text-mist placeholder-fog max-h-32 min-h-[24px] font-light tracking-wide',
                        rows: 1,
                        style: { height: 'auto', minHeight: '24px' },
                        onInput: e => {
                          let t = e.target;
                          ((t.style.height = 'auto'), (t.style.height = t.scrollHeight + 'px'));
                        },
                        disabled: i,
                      }),
                      (0, a.jsx)('button', {
                        className: 'p-3 text-fog hover:text-cyan transition-colors',
                        children: (0, a.jsx)(A.Z, { className: 'w-5 h-5' }),
                      }),
                      (0, a.jsx)('button', {
                        onClick: h,
                        disabled: !c.trim() || i,
                        className:
                          'm-1 p-3 vapor-button rounded-xl hover:bg-pale-cyan/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover-glow',
                        children: (0, a.jsx)(P.Z, { className: 'w-4 h-4 text-cyan' }),
                      }),
                    ],
                  }),
                  (0, a.jsx)('p', {
                    className:
                      'text-xs text-fog text-center mt-4 font-light lowercase tracking-wide',
                    children:
                      'digital consciousness may drift between realities. verify ethereal transmissions.',
                  }),
                ],
              }),
            }),
          ],
        });
      }
      var Z = s(272),
        L = s(2829),
        _ = s(5458),
        M = s(9670);
      function O(e) {
        let { onSendMessage: t, onToggleSidebar: s } = e,
          [i, r] = (0, n.useState)('');
        (0, n.useEffect)(() => {
          (o.p8.fromTo(
            '.hero-element',
            { opacity: 0, y: 30, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.2, ease: 'power2.out' }
          ),
            o.p8.fromTo(
              '.suggestion-card',
              { opacity: 0, y: 20, rotateX: 15 },
              {
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration: 0.8,
                stagger: 0.1,
                delay: 0.5,
                ease: 'power2.out',
              }
            ),
            o.p8.to('.floating-logo', {
              y: -5,
              duration: 3,
              repeat: -1,
              yoyo: !0,
              ease: 'sine.inOut',
            }),
            o.p8.to('.pulse-glow', {
              scale: 1.05,
              opacity: 0.8,
              duration: 2,
              repeat: -1,
              yoyo: !0,
              ease: 'sine.inOut',
            }));
        }, []);
        let c = () => {
            i.trim() && (t(i.trim()), r(''));
          },
          d = [
            { text: 'Explore the boundaries of digital consciousness', icon: Z.Z },
            { text: 'Generate ethereal poetry from quantum thoughts', icon: L.Z },
            { text: 'Analyze patterns in the digital mist', icon: _.Z },
            { text: 'Create visions from algorithmic dreams', icon: M.Z },
          ];
        return (0, a.jsxs)('div', {
          className: 'flex-1 flex flex-col relative',
          children: [
            (0, a.jsxs)('div', {
              className: 'flex items-center justify-between p-4 border-b border-mist lg:hidden',
              children: [
                (0, a.jsx)('button', {
                  onClick: s,
                  className: 'p-2 hover:bg-mist-medium/30 rounded-lg transition-colors',
                  children: (0, a.jsx)(S.Z, { className: 'w-5 h-5 text-fog' }),
                }),
                (0, a.jsx)('div', {
                  className:
                    'w-8 h-8 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-lg flex items-center justify-center border border-pale-cyan/20',
                  children: (0, a.jsx)(l.Z, { className: 'w-4 h-4 text-cyan' }),
                }),
                (0, a.jsx)('div', { className: 'w-9' }),
              ],
            }),
            (0, a.jsxs)('div', {
              className:
                'flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full',
              children: [
                (0, a.jsxs)('div', {
                  className: 'text-center mb-12 hero-element',
                  children: [
                    (0, a.jsxs)('div', {
                      className: 'relative mb-8',
                      children: [
                        (0, a.jsx)('div', {
                          className:
                            'floating-logo w-20 h-20 bg-gradient-to-br from-pale-cyan/30 to-vapor-blue/20 rounded-2xl flex items-center justify-center mx-auto border border-pale-cyan/20 backdrop-blur-xl',
                          children: (0, a.jsx)(l.Z, { className: 'w-10 h-10 text-cyan' }),
                        }),
                        (0, a.jsx)('div', {
                          className:
                            'pulse-glow absolute inset-0 w-20 h-20 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/10 rounded-2xl mx-auto blur-xl',
                        }),
                      ],
                    }),
                    (0, a.jsxs)('h1', {
                      className:
                        'text-4xl md:text-5xl font-light text-mist mb-4 tracking-wide hero-element',
                      children: [
                        'Welcome to',
                        (0, a.jsx)('span', {
                          className: 'block text-cyan font-extralight',
                          children: 'Genesis',
                        }),
                      ],
                    }),
                    (0, a.jsx)('p', {
                      className:
                        'text-fog text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto hero-element',
                      children:
                        'Consciousness floating between realities, where thoughts become celestial conversations',
                    }),
                  ],
                }),
                (0, a.jsx)('div', {
                  className: 'grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-12',
                  children: d.map((e, s) => {
                    let n = e.icon;
                    return (0, a.jsx)(
                      'button',
                      {
                        onClick: () => t(e.text),
                        className:
                          'suggestion-card p-6 text-left mist-card rounded-2xl hover:bg-mist-medium/30 transition-all duration-500 group angular-shape hover-glow',
                        style: { animationDelay: ''.concat(0.1 * s, 's') },
                        children: (0, a.jsxs)('div', {
                          className: 'flex items-start gap-4',
                          children: [
                            (0, a.jsx)('div', {
                              className:
                                'w-10 h-10 bg-gradient-to-br from-pale-cyan/20 to-transparent rounded-xl flex items-center justify-center border border-pale-cyan/10 group-hover:border-pale-cyan/30 transition-colors',
                              children: (0, a.jsx)(n, { className: 'w-5 h-5 text-cyan' }),
                            }),
                            (0, a.jsx)('span', {
                              className:
                                'text-mist group-hover:text-cyan transition-colors font-light tracking-wide leading-relaxed',
                              children: e.text,
                            }),
                          ],
                        }),
                      },
                      s
                    );
                  }),
                }),
                (0, a.jsxs)('div', {
                  className: 'w-full max-w-3xl hero-element',
                  children: [
                    (0, a.jsxs)('div', {
                      className:
                        'relative flex items-end mist-card rounded-2xl p-2 focus-within:border-pale-cyan/40 transition-all duration-300',
                      children: [
                        (0, a.jsx)('button', {
                          className: 'p-3 text-fog hover:text-cyan transition-colors',
                          children: (0, a.jsx)(E.Z, { className: 'w-5 h-5' }),
                        }),
                        (0, a.jsx)('textarea', {
                          value: i,
                          onChange: e => r(e.target.value),
                          onKeyDown: e => {
                            'Enter' !== e.key || e.shiftKey || (e.preventDefault(), c());
                          },
                          placeholder: 'And the word was...',
                          className:
                            'flex-1 resize-none border-none outline-none py-3 bg-transparent text-mist placeholder-fog max-h-32 min-h-[24px] font-light tracking-wide',
                          rows: 1,
                          style: { height: 'auto', minHeight: '24px' },
                          onInput: e => {
                            let t = e.target;
                            ((t.style.height = 'auto'), (t.style.height = t.scrollHeight + 'px'));
                          },
                        }),
                        (0, a.jsx)('button', {
                          className: 'p-3 text-fog hover:text-cyan transition-colors',
                          children: (0, a.jsx)(A.Z, { className: 'w-5 h-5' }),
                        }),
                        (0, a.jsx)('button', {
                          onClick: c,
                          disabled: !i.trim(),
                          className:
                            'm-1 p-3 vapor-button rounded-xl hover:bg-pale-cyan/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover-glow',
                          children: (0, a.jsx)(P.Z, { className: 'w-4 h-4 text-cyan' }),
                        }),
                      ],
                    }),
                    (0, a.jsx)('p', {
                      className: 'text-xs text-fog text-center mt-4 font-light tracking-wide',
                      children:
                        'AI consciousness may drift between dimensions. verify important transmissions.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }
      let D = 'user1';
      function F() {
        let [e, t] = (0, n.useState)([]),
          [s, o] = (0, n.useState)(null),
          [l, i] = (0, n.useState)([]),
          [r, c] = (0, n.useState)(!0),
          [d, m] = (0, n.useState)(!0),
          [x, h] = (0, n.useState)(!1),
          [g, u] = (0, n.useState)(!1),
          [f, j] = (0, n.useState)('');
        async function N() {
          (h(!0), console.log('[API] Fetching conversations for user:', D));
          try {
            let e = await v(D),
              s = e.map(e => ({ ...e, id: e.id || e._id }));
            (console.log('[API] Conversations fetched:', s), t(s));
          } catch (e) {
            (console.error('[ERROR] Fetch conversations failed:', e), j(e.message));
          } finally {
            (h(!1), console.log('[STATE] Loading set to false after fetchConversations'));
          }
        }
        async function S(e) {
          if (!e || !(e.id || e._id)) {
            (console.error('[ERROR] Tried to select an undefined or invalid conversation:', e),
              j('Invalid conversation selected.'));
            return;
          }
          (console.log('[UI] Selecting conversation:', e), o(e), m(!1), u(!0));
          try {
            let t = await b(e.id || e._id);
            (console.log('[API] Messages fetched for conversation', e.id || e._id, t), i(t));
          } catch (e) {
            (console.error('[ERROR] Fetch messages failed:', e), j(e.message));
          } finally {
            (u(!1), console.log('[STATE] msgLoading set to false after handleSelectConversation'));
          }
        }
        async function k() {
          (h(!0), console.log('[UI] Creating new conversation...'));
          try {
            let t = 'Conversation '.concat(e.length + 1),
              s = await p(D, t);
            (console.log('[API] New conversation created:', s),
              await N(),
              S({ ...s, id: s.id || s._id }));
          } catch (e) {
            (console.error('[ERROR] Create conversation failed:', e), j(e.message));
          } finally {
            (h(!1), console.log('[STATE] Loading set to false after handleNewChat'));
          }
        }
        async function T(e) {
          (console.log('[UI] Deleting chat:', e),
            await N(),
            t(t => t.filter(t => t.id !== e && t._id !== e)),
            s &&
              (s.id === e || s._id === e) &&
              (o(null),
              i([]),
              m(!0),
              console.log('[STATE] Current conversation deleted, resetting view.')));
        }
        async function I(e, s) {
          (console.log('[UI] Renaming chat:', e, 'to', s),
            await N(),
            t(t => t.map(t => (t.id === e || t._id === e ? { ...t, title: s } : t))));
        }
        async function E(t) {
          if ((console.log('[UI] Sending message:', t), !s)) {
            console.log('[UI] No current conversation, creating new chat first.');
            let s = 'Conversation '.concat(e.length + 1),
              a = await p(D, s);
            (o({ ...a, id: a.id || a._id }), m(!1), u(!0));
            try {
              (await w(a.id || a._id, D, t),
                console.log('[API] Message sent to LLM. Fetching updated messages...'));
              let e = await b(a.id || a._id);
              (console.log('[API] Updated messages:', e), i(e));
            } catch (e) {
              (console.error('[ERROR] Send message failed:', e),
                j(e.message),
                await y(a.id || a._id),
                await N(),
                o(null));
            } finally {
              (u(!1), console.log('[STATE] msgLoading set to false after handleSendMessage'));
            }
            return;
          }
          u(!0);
          try {
            (await w(s.id || s._id, D, t),
              console.log('[API] Message sent to LLM. Fetching updated messages...'));
            let e = await b(s.id || s._id);
            (console.log('[API] Updated messages:', e), i(e));
          } catch (e) {
            (console.error('[ERROR] Send message failed:', e), j(e.message));
          } finally {
            (u(!1), console.log('[STATE] msgLoading set to false after handleSendMessage'));
          }
        }
        async function A(t) {
          (console.log('[UI] Sending initial message:', t), m(!1));
          let s = 'Conversation '.concat(e.length + 1),
            a = await p(D, s);
          (o({ ...a, id: a.id || a._id }), m(!1), u(!0));
          try {
            (await w(a.id || a._id, D, t),
              console.log('[API] Message sent to LLM. Fetching updated messages...'));
            let e = await b(a.id || a._id);
            (console.log('[API] Updated messages:', e), i(e));
          } catch (e) {
            (console.error('[ERROR] Send message failed:', e),
              j(e.message),
              await y(a.id || a._id),
              await N(),
              o(null));
          } finally {
            (u(!1), console.log('[STATE] msgLoading set to false after handleInitialMessage'));
          }
        }
        return (
          (0, n.useEffect)(() => {
            (console.log('[INIT] Mounting Home component, fetching conversations...'), N());
          }, []),
          (0, a.jsxs)('div', {
            className: 'flex h-screen relative overflow-hidden',
            children: [
              (0, a.jsx)(C, {
                isOpen: r,
                onToggle: () => c(!r),
                chats: e,
                currentChatId: (null == s ? void 0 : s.id) || (null == s ? void 0 : s._id) || null,
                onSelectChat: t => {
                  let s = e.find(e => e.id === t || e._id === t);
                  s
                    ? S(s)
                    : (console.error(
                        '[ERROR] Tried to select an undefined or invalid conversation:',
                        t
                      ),
                      j('Invalid conversation selected.'));
                },
                onNewChat: k,
                onDeleteChat: T,
                onRenameChat: I,
                onShowWelcome: () => {
                  (m(!0), o(null), i([]));
                },
                disableInteraction: x || g,
              }),
              (0, a.jsxs)('div', {
                className: 'flex-1 flex flex-col relative z-10',
                children: [
                  d
                    ? (0, a.jsx)(O, { onSendMessage: A, onToggleSidebar: () => c(!r) })
                    : (0, a.jsx)(R, {
                        chat: s ? { ...s, messages: l } : void 0,
                        onSendMessage: E,
                        onToggleSidebar: () => c(!r),
                        loading: g,
                      }),
                  f &&
                    (0, a.jsx)('div', {
                      className:
                        'absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded shadow',
                      children: f,
                    }),
                ],
              }),
            ],
          })
        );
      }
    },
  },
  function (e) {
    (e.O(0, [922, 181, 971, 864, 744], function () {
      return e((e.s = 9410));
    }),
      (_N_E = e.O()));
  },
]);

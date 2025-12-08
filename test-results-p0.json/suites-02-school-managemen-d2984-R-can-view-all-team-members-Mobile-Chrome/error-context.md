# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e5]:
        - link "kartis.info" [ref=e8] [cursor=pointer]:
          - /url: /admin
        - generic [ref=e9]:
          - button "צור אירוע חדש" [ref=e11]:
            - img [ref=e13]
            - generic [ref=e14]: אירוע חדש
            - img [ref=e15]
          - link [ref=e17] [cursor=pointer]:
            - /url: /admin/help
            - img [ref=e18] [cursor=pointer]
          - button [ref=e21]:
            - img [ref=e22]
    - main [ref=e23]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - heading "ניהול צוות" [level=1] [ref=e28]
            - paragraph [ref=e29]: הזמן חברי צוות חדשים לבית הספר שלך
          - button "בקרוב" [disabled] [ref=e30]:
            - img [ref=e31]
            - text: בקרוב
        - generic [ref=e34]:
          - heading "הזמנות" [level=2] [ref=e36]
          - generic [ref=e37]: אין הזמנות עדיין. לחץ על "הזמן חבר צוות" כדי להתחיל.
    - link "צור קשר דרך WhatsApp" [ref=e38] [cursor=pointer]:
      - /url: https://wa.me/972555020829
      - img [ref=e41] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]:
    - img [ref=e49] [cursor=pointer]
  - alert [ref=e52]
```
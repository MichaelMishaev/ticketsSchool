# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "חזרה לדף הבית" [ref=e3]:
      - /url: /
      - img [ref=e4]
      - generic [ref=e7]: חזרה לדף הבית
    - generic [ref=e8]:
      - generic [ref=e9]:
        - img [ref=e11]
        - heading "כניסת מנהלים" [level=2] [ref=e14]
        - paragraph [ref=e15]: kartis.info Admin Panel
      - generic [ref=e16]:
        - link "המשך עם Google" [ref=e18]:
          - /url: /api/auth/google
          - img [ref=e19]
          - text: המשך עם Google
        - generic [ref=e28]: או התחבר עם אימייל
        - generic [ref=e29]:
          - generic [ref=e30]:
            - generic [ref=e31]: שם משתמש או אימייל
            - textbox "שם משתמש או אימייל" [ref=e33]
          - generic [ref=e34]:
            - generic [ref=e35]: סיסמה
            - textbox "סיסמה" [ref=e37]
          - button "התחבר" [ref=e39]
        - generic [ref=e40]:
          - link "שכחתי סיסמה" [ref=e41] [cursor=pointer]:
            - /url: /admin/forgot-password
          - link "הרשמה" [ref=e42] [cursor=pointer]:
            - /url: /admin/signup
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]:
    - img [ref=e49] [cursor=pointer]
  - alert [ref=e54]
```
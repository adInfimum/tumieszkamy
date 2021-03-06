# Ściąganie dokumentów i rozliczeń z TuMieszkamy/Atrium21

## Instalacja

Rozszerzenie działa tylko na przeglądarce Chrome. Możesz ją zainstalować [tutaj](https://www.google.com/chrome).

Rozszerzenie można zainstalować z oficjalnej strony z roszerzeniami Chrome [tutaj](https://chrome.google.com/webstore/detail/pobieranie-faktur-z-tumie/effinocpaojdjnohnaekegbackedfmbi).

## Sposób użycia

1. Zaloguj się do swojego konta w portalu [TuMieszkamy/Atrium21](https://www.strefaklienta24.pl/atrium21/content/InetObsKontr/login)
1. Przejdź na stronę [finanse](https://www.strefaklienta24.pl/atrium21/content/InetObsKontr/finanse) i wybierz swoje konto (jeżeli masz więcej niż jedno, następne kroki należy powtórzyć dla każdego konta)
1. Przeładuj stronę (Ctrl+R lub z przyciskiem obok paska adresu) lub kliknij ikonę rozszerzenia w pasku Chrome: pojawi się przycisk do ściągnięcia wszystkich dokumentów finansowych
![Obraz działającego rozszerzenia](tumieszkamy-screenshot.png?raw=true)
1. Wciśnij przycisk. Poczekaj na zakończenie pobierania (tekst na przycisku jest aktualizowany w miarę postępu pobierania)
1. Wszystkie pliki są pobierane do twojego domyślnego katalogu Pobrane/Downloads

## Ściągane pliki

- Wszystkie dostępne dokumenty PDF (faktury, noty itd) w plikach o nazwie `<numer twojego kont>-<data dokumentu>-<numer dokumentu>.pdf`
- CSV z podsumowaniem dokumentów rozliczeniowych w pliku o nazwie `<numer twojego kont>-dokumenty.csv`
- CSV ze szczegółami dokumentów rozliczeniowych (wszystkie linie faktury lub noty) w pliku o nazwie `<numer twojego kont>-linieFaktur.csv`
- CSV ze szczegółami rozliczeń (dla każdej faktury noty zawiera informację jakie wpłaty zostały na nią alokowane i vice versa) w pliku o nazwie `<numer twojego kont>-linieFaktur.csv`
- Dodatkowo surowe dane w pliku `<numer twojego kont>-full.json`

Pliki CSV mogą być otware w Excelu lub OpenOffice/LibreOffice albo przy użyciu Dokumentów Google.
W tym celu należy je wgrać na swój [dysk google](https://drive.google.com), otworzyć w z menu "Otwórz w" na górz wybrać "Arkusze Google".
Tak wczytany plik można sformatować (np. niektóre kwoty są błędnie rozpoznawane jako daty), sortować itd.

## Dane osobowe (RODO)

Autor nie przetwarza, ani nie ma nawet dostępu do żadnych danych osobowych użytkownika.
Rozszerzenie działa całkowicie lokalnie i może być używane jedynie do ściągania danych, do których wgląd ma użytkownik.

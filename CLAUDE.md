# Beranis - cockpit de révision CRFPA

Application de suivi de révision pour une seule utilisatrice, candidate au
CRFPA session septembre 2026, spécialité droit civil. L'objectif n'est pas de
faire un dashboard décoratif : l'écran doit répondre vite à deux questions.

- Qu'est-ce que je dois faire cette semaine ?
- Suis-je dans les temps par rapport au programme officiel ?

Ce fichier est la source de vérité produit et UI. En cas de conflit avec une
convention générique, appliquer ce fichier.

## Stack et contraintes Next

- Next.js 16.2, App Router, TypeScript strict.
- Lire `node_modules/next/dist/docs/` avant de modifier une API Next. Cette
  version a des conventions différentes de la mémoire modèle.
- React Server Components par défaut. `"use client"` seulement pour les gestes
  interactifs : steppers, checkboxes optimistes, formulaires, charts.
- Tailwind CSS v4 en CSS-first dans `app/globals.css`. Pas de
  `tailwind.config.ts`.
- Supabase Auth + Postgres. Mutations via Server Actions dans
  `lib/actions/*.ts`, avec `revalidatePath`.
- Recharts uniquement pour `/timeline`.

## Données immuables

| Épreuve | Date | Durée |
|---|---:|---:|
| Note de synthèse | 2026-09-01 | 5h |
| Droit des obligations | 2026-09-02 | 3h |
| Droit civil (spé) | 2026-09-03 | 3h |
| Procédure civile | 2026-09-04 | 2h |

## Modèle programme

Le référentiel n'est plus une droite linéaire inventée. Le programme
Pré-Barreau fournit le plan :

- 7 semaines de programme du 2026-06-29 au 2026-08-16.
- 8 sujets par matière, stockés dans `assignments`.
- Obligations et procédure : échéances le lundi.
- Civil : échéances le mardi.
- Sujet 8 transversal : `2026-08-16` par convention, à ajuster si la plateforme
  donne une autre date.

Chaque chapitre porte `program_week` :

- `1..7` : chapitre attendu pendant cette semaine du programme.
- `null` : hors programme hebdomadaire, traité en période de révision.

Les anciens jalons V1 inventés ne doivent plus structurer l'app. Ils peuvent
exister dans une base sale, mais l'UI ne doit pas les remettre au centre.

## Avancement

`lib/progress.ts` garde les primitives pures :

- statuts : `non_vu -> lu -> fiche -> revise -> maitrise`
- poids : `0 / 0.30 / 0.55 / 0.80 / 1`
- `subjectProgress`, `daysUntil`, `paceLabel`, constantes de statut.

`lib/program-pace.ts` est le référentiel courant :

- Phase programme : un chapitre est attendu au statut `lu` quand sa semaine est
  passée. On ne reproche pas de ne pas avoir fiché en juillet un chapitre prévu
  en août.
- Phase révision : à partir du 2026-08-16, montée linéaire de l'état de fin de
  programme vers `maitrise` avant `date_examen - 7 jours`.
- `programPace(chapters, todayIso, examDateIso)` produit le libellé d'avance ou
  de retard affiché dans les matières.

La timeline doit utiliser `expectedProgramProgress`, jamais l'ancien modèle
linéaire.

## Routes V1

### `/` - cockpit quotidien

Premier écran utile, dense et lisible en quelques secondes :

1. Countdown de la prochaine épreuve.
2. Bloc `Cette semaine` :
   - sujets de la semaine courante ;
   - checkbox optimiste sur `assignments.done_at` ;
   - compteur des sujets en retard.
3. Blocs matières avec progression, pace au programme et `StatusStepper`.
4. Sidebar desktop :
   - rail des 4 épreuves ;
   - prochains jalons réels ;
   - synthèse.

En période de révision, `Cette semaine` devient `période de révision` et montre
les sujets transversaux + chapitres faibles.

### `/matieres/[slug]` - table de travail

Liste compacte des chapitres d'une matière. Le geste principal est le
`StatusStepper` : tap sur la ligne, choix du statut, mutation optimiste, rollback
et toast d'erreur si échec.

### `/timeline` - contrôle secondaire

La timeline n'est pas une page décorative. Elle montre :

- réel actuel vs théorique actuel ;
- courbe réelle vs courbe programme ;
- repères d'examens sobres dans le graphe ;
- échéances listées dans un rail, jamais empilées comme labels dans le chart.

Si la base active n'a pas `program_week` ou `assignments`, afficher un état de
données manquantes au lieu d'une courbe plate mensongère.

### `/synthese` - journal compact

Ajout d'un entraînement : date, durée, annale, ressenti, commentaire. Liste
simple, pas de timer en V1.

## Direction UI

Appliquer `frontend-skill` comme suit : c'est une app de travail, pas une landing
page.

Thèse visuelle : surface calme, prune, dense, avec un seul accent d'action.
L'interface doit se lire comme un outil quotidien, pas comme une grille de KPI.

Règles :

- Pas de hero marketing.
- Pas de mosaïque de cards.
- Pas de pages étroites flottant au milieu d'un écran desktop.
- Le layout desktop standard est `max-w-5xl` avec colonne principale + sidebar
  sticky quand il y a un contexte secondaire.
- Les cartes ne sont autorisées que pour un outil réellement encadré : chart,
  modal, liste interactive. Les sections informatives utilisent des filets
  supérieurs.
- Garder l'écran scannable : titres courts, données alignées, labels mono.
- Pas de texte qui explique l'UI elle-même dans l'app.

## Design system

Voir `app/globals.css`.

- `plum` : structure, texte, fonds, bordures. Aucun `gray-*`, `slate-*`,
  `zinc-*`, `neutral-*`, `stone-*`.
- `petale` : action, réel, retard. Usage parcimonieux.
- `ciel` : information, théorique, dates d'examen. Jamais une action.
- Display : Instrument Serif, titres et grands chiffres.
- Texte : Instrument Sans.
- Données : Spline Sans Mono, chiffres tabulaires.
- Radius : `--radius`.
- Ombre unique : `--shadow-hairline`.
- Dégradé uniquement dans le `StatusStepper`.

## Motion

Rester sobre :

- transitions 150ms sur statuts, popovers, hover utiles ;
- animation de croissance des barres d'avancement ;
- respecter `prefers-reduced-motion`.

Ne pas ajouter d'animations décoratives.

## Hors scope

- IA, upload PDF, lecture PDF.
- Multi-utilisateurs.
- Notifications.
- Dark mode.
- Settings.
- Landing page.

## Definition of done

- `pnpm lint` vert.
- `pnpm test` vert.
- `pnpm exec tsc --noEmit` vert.
- `pnpm build` vert quand demandé par l'utilisateur.
- Vérification visuelle mobile et desktop dès qu'une session auth est
  disponible.
- Aucune mutation sans auth serveur, validation minimale, rollback optimiste si
  UI client.

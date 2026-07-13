-- Seed v2 - remplace le découpage V1 par le grain du programme Pré-Barreau.
-- Remplacer :USER_ID. À exécuter après 002_program.sql.
-- ATTENTION : supprime les chapitres V1 (et leurs status_events en cascade).
-- Si elle a déjà coché des statuts, faire un mapping manuel avant.

delete from chapters where user_id = :USER_ID;

-- ============ DROIT DES OBLIGATIONS (sujets le lundi) ============
insert into chapters (user_id, subject_id, name, pdf_ref, weight, program_week, sort_order) values
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Preuves', 'Cours_OB_1_Preuve pp. 5–24', 2, 1, 0),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Contrats - introduction et formation', 'Cours_OB_2 pp. 9–40', 3, 2, 1),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'RGO - actions du créancier, modalités temporelles', 'Cours_OB_4 pp. 7–29', 3, 2, 2),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Contrats - validité : conditions tenant aux personnes', 'Cours_OB_2 pp. 41–61', 3, 3, 3),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'RGO - modalités structurelles', 'Cours_OB_4 pp. 31–42', 2, 3, 4),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Contrats - validité : contenu et sanctions', 'Cours_OB_2 pp. 61–93', 4, 4, 5),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'RGO - opérations translatives', 'Cours_OB_4 pp. 43–61', 3, 4, 6),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Contrats - effets, inexécution, annexes', 'Cours_OB_2 pp. 95–147', 5, 5, 7),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'RGO - opérations créatrices', 'Cours_OB_4 pp. 63–70', 1, 5, 8),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'RC - principes communs, fait d''une personne', 'Cours_OB_3 pp. 5–35', 4, 6, 9),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'RGO - extinction de l''obligation', 'Cours_OB_4 pp. 71–86', 2, 6, 10),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'RC - fait d''une chose, annexes', 'Cours_OB_3 pp. 37–73', 4, 7, 11),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Quasi-contrats', 'Cours_OB_5 pp. 5–27', 2, 7, 12);

-- ============ DROIT CIVIL - SPÉCIALITÉ (sujets le mardi) ============
insert into chapters (user_id, subject_id, name, pdf_ref, weight, program_week, sort_order) values
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Couple hors mariage, formation du mariage', 'Tome 1 pp. 9–50', 3, 1, 0),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Vie du couple marié, désunion et divorce', 'Tome 1 pp. 51–97', 4, 2, 1),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Effets du divorce, l''enfant', 'Tome 1 pp. 98–183', 5, 3, 2),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Qualification, vente, entreprise, prêt, mandat', 'Tome 2 pp. 7–92', 5, 4, 3),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Bail ; cautionnement, garanties, gage, nantissement', 'Tome 2 pp. 93–104 + Tome 3 pp. 7–102', 5, 5, 4),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Privilèges, sûretés immobilières ; intro biens, propriété individuelle', 'Tome 3 pp. 103–129 + Tome 4 pp. 5–60', 4, 6, 5),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Protection de la propriété, propriété collective, démembrements', 'Tome 4 pp. 61–117', 4, 7, 6);

-- ============ PROCÉDURE CIVILE (sujets le lundi) ============
insert into chapters (user_id, subject_id, name, pdf_ref, weight, program_week, sort_order) values
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'L''action en justice', 'Cours_PC pp. 11–24', 3, 1, 0),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Moyens de défense, compétence', 'Cours_PC pp. 24–44', 3, 2, 1),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Procédure devant le tribunal judiciaire', 'Cours_PC pp. 71–81', 3, 3, 2),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Référé, requête, mesures d''instruction', 'Cours_PC pp. 83–86 + 67–70', 2, 4, 3),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Qualification du jugement, exécution provisoire', 'Cours_PC pp. 87–98', 2, 5, 4),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'L''appel', 'Cours_PC pp. 103–114', 3, 6, 5),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Voies d''exécution', 'Cours_PCE', 3, 7, 6);
-- MARC : hors programme hebdo, à réviser en période de révision
insert into chapters (user_id, subject_id, name, pdf_ref, weight, program_week, sort_order) values
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'MARC', 'Cours_MARC', 1, null, 7);

-- ============ SUJETS À RENDRE (8 × 3 matières) ============
-- Obligations et Procédure : lundis. Civil : mardis. N°8 transversal : après le 16 août.
insert into assignments (user_id, subject_id, week_number, title, pages, due_date) values
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 1, 'Sujet 1 - Preuves', 'pp. 5–24', '2026-06-29'),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 2, 'Sujet 2 - Formation du contrat, RGO T1–T2', 'pp. 9–40 + 7–29', '2026-07-06'),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 3, 'Sujet 3 - Validité (personnes), modalités structurelles', 'pp. 41–61 + 31–42', '2026-07-13'),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 4, 'Sujet 4 - Validité (contenu, sanctions), opérations translatives', 'pp. 61–93 + 43–61', '2026-07-20'),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 5, 'Sujet 5 - Effets et inexécution, opérations créatrices', 'pp. 95–147 + 63–70', '2026-07-27'),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 6, 'Sujet 6 - RC (principes, fait d''une personne), extinction', 'pp. 5–35 + 71–86', '2026-08-03'),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 7, 'Sujet 7 - RC (fait d''une chose), quasi-contrats', 'pp. 37–73 + 5–27', '2026-08-10'),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 8, 'Sujet 8 - transversal (plateforme)', null, '2026-08-16'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 1, 'Sujet 1 - Couple hors mariage, formation du mariage', 'T1 pp. 9–50', '2026-06-30'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 2, 'Sujet 2 - Vie du couple, désunion, divorce', 'T1 pp. 51–97', '2026-07-07'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 3, 'Sujet 3 - Effets du divorce, l''enfant', 'T1 pp. 98–183', '2026-07-14'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 4, 'Sujet 4 - Qualification, vente, entreprise, prêt, mandat', 'T2 pp. 7–92', '2026-07-21'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 5, 'Sujet 5 - Bail, cautionnement, garanties, gage, nantissement', 'T2 + T3', '2026-07-28'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 6, 'Sujet 6 - Privilèges, sûretés immo ; intro biens, propriété', 'T3 + T4', '2026-08-04'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 7, 'Sujet 7 - Protection propriété, collective, démembrements', 'T4 pp. 61–117', '2026-08-11'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 8, 'Sujet 8 - transversal (plateforme)', null, '2026-08-16'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 1, 'Sujet 1 - Action en justice', 'pp. 11–24', '2026-06-29'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 2, 'Sujet 2 - Moyens de défense, compétence', 'pp. 24–44', '2026-07-06'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 3, 'Sujet 3 - Procédure devant le TJ', 'pp. 71–81', '2026-07-13'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 4, 'Sujet 4 - Référé, requête, mesures d''instruction', 'pp. 83–86 + 67–70', '2026-07-20'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 5, 'Sujet 5 - Qualification du jugement, exécution provisoire', 'pp. 87–98', '2026-07-27'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 6, 'Sujet 6 - L''appel', 'pp. 103–114', '2026-08-03'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 7, 'Sujet 7 - Voies d''exécution', null, '2026-08-10'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 8, 'Sujet 8 - transversal (plateforme)', null, '2026-08-16');

-- Statuts de départ réalistes pour éviter un dashboard entièrement à 0 %.
-- Ajuster ou supprimer ce bloc si une reprise depuis des statuts existants est faite.
update chapters
set status = 'fiche'
where user_id = :USER_ID
  and subject_id = '00000000-0000-0000-0000-000000000002'
  and name = 'Preuves';

update chapters
set status = 'lu'
where user_id = :USER_ID
  and subject_id = '00000000-0000-0000-0000-000000000004'
  and name = 'L''action en justice';

update chapters
set status = 'lu'
where user_id = :USER_ID
  and subject_id = '00000000-0000-0000-0000-000000000003'
  and name = 'Couple hors mariage, formation du mariage';

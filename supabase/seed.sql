-- Prétoire - seed V1
-- À exécuter APRÈS la première connexion de l'utilisatrice (il faut son uuid).
-- Remplacer :USER_ID par l'uuid réel (select id from auth.users;).
-- Les chapitres et pdf_ref correspondent à ses supports de prépa estivale (EST26).

-- Matières
insert into subjects (id, user_id, slug, name, exam_date, exam_duration_min, has_chapters, sort_order) values
  ('00000000-0000-0000-0000-000000000001', :USER_ID, 'synthese',    'Note de synthèse',        '2026-09-01', 300, false, 0),
  ('00000000-0000-0000-0000-000000000002', :USER_ID, 'obligations', 'Droit des obligations',   '2026-09-02', 180, true,  1),
  ('00000000-0000-0000-0000-000000000003', :USER_ID, 'civil',       'Droit civil (spé)',       '2026-09-03', 180, true,  2),
  ('00000000-0000-0000-0000-000000000004', :USER_ID, 'procedure',   'Procédure civile',        '2026-09-04', 120, true,  3);

-- Chapitres - Droit des obligations (weight = taille relative 1..5)
insert into chapters (user_id, subject_id, name, pdf_ref, weight, sort_order) values
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Régime général de l''obligation', 'Cours_OB_4_RGO_EST26', 4, 0),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Contrats - formation et effets',  'Cours_OB_2_Contrats_EST26', 5, 1),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Responsabilité civile',           'Cours_OB_3_RC_EST26', 5, 2),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Quasi-contrats',                  'Cours_OB_5_Quasi_EST26', 2, 3),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Preuve des obligations',          'Cours_OB_1_Preuve_EST26', 2, 4),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Documents complémentaires',       'Docs_Supp_Cours_OB', 1, 5);

-- Chapitres - Droit civil (spécialité)
insert into chapters (user_id, subject_id, name, pdf_ref, weight, sort_order) values
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Famille et régimes matrimoniaux', 'Cours_Civil_1_Famille_RM', 5, 0),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Contrats spéciaux',               'Cours_Civil_2_Contrats_speciaux', 4, 1),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Sûretés',                         'Cours_Civil_3_Suretes', 4, 2),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Droit des biens',                 'Cours_Civil_4_Biens', 3, 3);

-- Chapitres - Procédure civile
insert into chapters (user_id, subject_id, name, pdf_ref, weight, sort_order) values
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Procédure civile',                    'Cours_PC_EST26', 5, 0),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Procédures civiles d''exécution',     'Cours_PCE_EST26', 3, 1),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Modes amiables de résolution (MARC)', 'Cours_MARC_EST26', 2, 2);

-- Jalons (plan indicatif, modifiable dans l'app)
insert into milestones (user_id, subject_id, title, due_date) values
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Obligations : tout lu',            '2026-07-26'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Civil : tout lu',                  '2026-08-02'),
  (:USER_ID, '00000000-0000-0000-0000-000000000002', 'Obligations : tout fiché',         '2026-08-09'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Procédure : tout lu',              '2026-08-09'),
  (:USER_ID, '00000000-0000-0000-0000-000000000003', 'Civil : tout fiché',               '2026-08-16'),
  (:USER_ID, '00000000-0000-0000-0000-000000000001', '5 annales de synthèse faites',     '2026-08-16'),
  (:USER_ID, '00000000-0000-0000-0000-000000000004', 'Procédure : tout fiché',           '2026-08-20'),
  (:USER_ID, null,                                    'Tout révisé - début sprint final', '2026-08-24');

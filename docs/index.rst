.. philadelphia documentation master file, created by
   sphinx-quickstart on Mon Oct  3 10:29:01 2011.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Philadelphia's documentation!
========================================
Philadelphia is a shift report system designed for the `SNO+ <http://snoplus.phy.queensu.ca>`_ neutrino experiment. It is inspired by Manhattan, the shift report system used for the SNO (Sudbury Neutrino Observatory) experiment, but makes several improvements.

The Philadelphia software itself contains nothing SNO+-specific, and so is easily portable to other sites.

*Requirements:* Philadelphia requires JavaScript to be enabled in your browser.

*Source code:* Philadelphia is free software. Source is available on `github <http://github.com/mastbaum/philadelphia>`_.

*Bug reports:* Please report any bugs through the `Issue Tracker <http://github.com/mastbaum/philadelphia/issues>`_.

Motivation
----------
The major strength and weakness of Manhattan was the flexibility of its input. The shift report was built by pasting templates into a large text box and filling in or modifying as needed. This is good, because it allows the shift operator to enter any relevant data in any format. It is bad, because this data is extremely difficult to query, plot, etc.

Philadelphia's interface aims to preserve the flexibility of Manhattan while introducing just enough structure to make queries possible. As in Manhattan, the report is composed by instantiating templates. Philadelphia's templates consist of form fields, but they can be removed and new ones can be added as the user sees fit. Additionally, free text-entry template gives the user a canvas to enter large amounts of uncategorized data, as was possible in Manhattan.

All fields in Philadelphia are queryable and plottable, even those added by users.

User's Guide
============

.. toctree::
   :maxdepth: 2

   page_index
   page_view
   page_compose
   page_plot

Administrator's Guide
=====================

.. toctree::
   :maxdepth: 2

   install
   templates

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`


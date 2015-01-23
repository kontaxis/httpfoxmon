#!/bin/bash

file=$1;

if [ ! -e "${file}" ]; then
	>&2 echo "ERROR. File '${file}' NOT FOUND."
	exit
fi

oIFS=${IFS}; IFS=$'\n';
for i in `grep httpfoxmon "${file}" | grep ">>>" | awk '{print $4}' | \
	sort | uniq | egrep -v "NULLDOC|\[about:|\[chrome:" | \
	sed -r s/"\[|\]"//g`; do

	echo -n "${i} ";

	bytes=`grep httpfoxmon "${file}" | egrep -v "NULLDOC|\[about:|\[chrome:" | \
		grep "\[${i}\]" | egrep -o "STOP [0-9]+\$" | \
		awk '{sum+=$2} END {print sum}'`;

	requests=`grep httpfoxmon "${file}" | \
		egrep -v "NULLDOC|\[about:|\[chrome:" | grep "\[${i}\]" | wc -l`;

	echo "${bytes} bytes ${requests} requests"
done
IFS=${oIFS};
